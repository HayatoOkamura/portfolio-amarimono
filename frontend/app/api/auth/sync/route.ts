import { NextResponse } from 'next/server'
import { backendUrl } from '@/app/utils/api'
import { supabase } from '@/app/lib/api/supabase/supabaseClient'

// 重複リクエスト防止用のMap
const pendingRequests = new Map<string, Promise<any>>();

// デバッグログ用の関数
const debugLog = (message: string, data?: any, requestId?: string) => {
  const timestamp = new Date().toISOString();
  const logId = requestId || Math.random().toString(36).substring(7);
  console.log(`[${timestamp}] [${logId}] 🔍 ${message}`, data ? JSON.stringify(data, null, 2) : '');
  return logId;
};

// 重複リクエストの統計情報
const requestStats = {
  total: 0,
  duplicates: 0,
  successful: 0,
  failed: 0
};

// 重複リクエストを防ぐためのヘルパー関数
const executeWithDebounce = async (key: string, operation: () => Promise<any>, requestId: string) => {
  requestStats.total++;
  
  // 既に実行中のリクエストがある場合はそれを返す
  if (pendingRequests.has(key)) {
    requestStats.duplicates++;
    debugLog('Duplicate request detected, waiting for existing request', { 
      key, 
      pendingRequestsCount: pendingRequests.size,
      stats: requestStats
    }, requestId);
    return await pendingRequests.get(key);
  }

  debugLog('Starting new request', { 
    key, 
    pendingRequestsCount: pendingRequests.size,
    stats: requestStats
  }, requestId);

  // 新しいリクエストを作成
  const promise = operation()
    .then((result) => {
      requestStats.successful++;
      debugLog('Request completed successfully', { 
        key, 
        stats: requestStats
      }, requestId);
      return result;
    })
    .catch((error) => {
      requestStats.failed++;
      debugLog('Request failed', { 
        key, 
        error: error.message,
        stats: requestStats
      }, requestId);
      throw error;
    })
    .finally(() => {
      // 完了後にMapから削除
      pendingRequests.delete(key);
      debugLog('Request removed from pending queue', { 
        key, 
        pendingRequestsCount: pendingRequests.size
      }, requestId);
    });

  // Mapに保存
  pendingRequests.set(key, promise);
  return promise;
};

export async function POST(request: Request) {
  const requestId = debugLog('Sync request started', undefined, undefined);
  
  try {
    // Authorizationヘッダーからアクセストークンを取得
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      debugLog('Invalid Authorization header', { authHeader, requestId }, requestId);
      return NextResponse.json({ error: '認証情報が不正です' }, { status: 401 });
    }
    const accessToken = authHeader.split(' ')[1];
    
    // Supabaseからユーザー情報を取得
    debugLog('Fetching user from Supabase', { requestId }, requestId);
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !authUser) {
      debugLog('Supabase user fetch error', { error: userError, requestId }, requestId);
      return NextResponse.json({ 
        error: 'ユーザー情報の取得に失敗しました',
        details: userError?.message 
      }, { status: 401 });
    }

    debugLog('User found in Supabase', { 
      userId: authUser.id,
      email: authUser.email,
      requestId
    }, requestId);

    // メール認証が完了していない場合はエラーを返す
    if (!authUser.email_confirmed_at) {
      debugLog('Email not confirmed', { userId: authUser.id, requestId }, requestId);
      return NextResponse.json({ error: 'メール認証が完了していません' }, { status: 403 });
    }

    // 重複リクエスト防止のためのキー
    const syncKey = `sync_${authUser.id}`;

    // デバウンス機能付きで同期処理を実行
    const result = await executeWithDebounce(syncKey, async () => {
      // バックエンドからユーザー情報を取得
      const apiUrl = `${backendUrl}/api/users/${authUser.id}`;
      debugLog('Fetching user from backend', { url: apiUrl, requestId }, requestId);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000),
      });

      debugLog('Backend response received', { 
        status: response.status,
        ok: response.ok,
        requestId
      }, requestId);

      // ユーザーが存在する場合はその情報を返す
      if (response.ok) {
        const user = await response.json();
        debugLog('User retrieved successfully', { userId: user.id, requestId }, requestId);
        return { success: true, user };
      }

      // 404エラーの場合（ユーザーが存在しない場合）は同期処理を試みる
      if (response.status === 404) {
        debugLog('User not found in backend, attempting sync', { requestId }, requestId);
        
        const userData = {
          id: authUser.id,
          email: authUser.email || '',
          username: '',
          age: 0,
          gender: "未設定"
        };

        debugLog('Syncing user', { userData, requestId }, requestId);

        const syncResponse = await fetch(`${backendUrl}/api/users/sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        debugLog('User sync response', {
          status: syncResponse.status,
          ok: syncResponse.ok,
          requestId
        }, requestId);

        if (syncResponse.ok) {
          const syncedUser = await syncResponse.json();
          debugLog('User synced successfully', { userId: syncedUser.id, requestId }, requestId);
          return { success: true, user: syncedUser };
        }

        // 重複エラーの場合は、ユーザーが既に作成されていると判断
        const responseText = await syncResponse.text();
        debugLog('User sync failed', {
          status: syncResponse.status,
          responseText,
          requestId
        }, requestId);

        if (syncResponse.status === 500 && responseText.includes('duplicate key')) {
          // 重複エラーの場合は、ユーザー情報を再取得
          const retryResponse = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (retryResponse.ok) {
            const retryUser = await retryResponse.json();
            debugLog('User retrieved after duplicate error', { userId: retryUser.id, requestId });
            return { success: true, user: retryUser };
          }
        }

        // prepared statementエラーの場合の特別な処理
        if (syncResponse.status === 500 && responseText.includes('prepared statement')) {
          debugLog('Prepared statement error detected, retrying after delay', { requestId });
          
          // 少し待機してから再試行
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const retryResponse = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (retryResponse.ok) {
            const retryUser = await retryResponse.json();
            debugLog('User retrieved after prepared statement error', { userId: retryUser.id, requestId });
            return { success: true, user: retryUser };
          }
        }

        return { 
          success: false, 
          error: 'ユーザーの同期に失敗しました',
          details: responseText,
          status: 500
        };
      }

      // その他のエラーの場合
      const errorText = await response.text();
      debugLog('Backend error', {
        status: response.status,
        errorText,
        requestId
      });

      return { 
        success: false,
        error: 'ユーザー情報の取得に失敗しました',
        details: errorText,
        status: response.status
      };
    }, requestId);

    // 結果を返す
    if (result.success) {
      return NextResponse.json(result.user);
    } else {
      return NextResponse.json({ 
        error: result.error,
        details: result.details
      }, { status: result.status });
    }

  } catch (error) {
    debugLog('Unexpected error in sync', {
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error,
      requestId
    });
    return NextResponse.json({ 
      error: '予期せぬエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 