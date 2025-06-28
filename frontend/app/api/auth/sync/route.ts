import { NextResponse } from 'next/server'
import { backendUrl } from '@/app/utils/api'
import { supabase } from '@/app/lib/api/supabase/supabaseClient'

// デバッグログ用の関数
const debugLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${timestamp}] [${requestId}] 🔍 ${message}`, data ? JSON.stringify(data, null, 2) : '');
  return requestId;
};

export async function POST(request: Request) {
  const requestId = debugLog('Sync request started');
  
  try {
    // Authorizationヘッダーからアクセストークンを取得
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      debugLog('Invalid Authorization header', { authHeader, requestId });
      return NextResponse.json({ error: '認証情報が不正です' }, { status: 401 });
    }
    const accessToken = authHeader.split(' ')[1];
    
    // Supabaseからユーザー情報を取得
    debugLog('Fetching user from Supabase', { requestId });
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !authUser) {
      debugLog('Supabase user fetch error', { error: userError, requestId });
      return NextResponse.json({ 
        error: 'ユーザー情報の取得に失敗しました',
        details: userError?.message 
      }, { status: 401 });
    }

    debugLog('User found in Supabase', { 
      userId: authUser.id,
      email: authUser.email,
      requestId
    });

    // メール認証が完了していない場合はエラーを返す
    if (!authUser.email_confirmed_at) {
      debugLog('Email not confirmed', { userId: authUser.id, requestId });
      return NextResponse.json({ error: 'メール認証が完了していません' }, { status: 403 });
    }

    // バックエンドからユーザー情報を取得
    const apiUrl = `${backendUrl}/api/users/${authUser.id}`;
    debugLog('Fetching user from backend', { url: apiUrl, requestId });
    
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
    });

    // ユーザーが存在する場合はその情報を返す
    if (response.ok) {
      const user = await response.json();
      debugLog('User retrieved successfully', { userId: user.id, requestId });
      return NextResponse.json(user);
    }

    // 404エラーの場合（ユーザーが存在しない場合）は新規作成を試みる
    if (response.status === 404) {
      debugLog('User not found in backend, attempting creation', { requestId });
      
      const userData = {
        id: authUser.id,
        email: authUser.email || '',
        username: '',
        age: 0,
        gender: "未設定"
      };

      debugLog('Creating new user', { userData, requestId });

      const createResponse = await fetch(`${backendUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      debugLog('User creation response', {
        status: createResponse.status,
        ok: createResponse.ok,
        requestId
      });

      if (createResponse.ok) {
        const newUser = await createResponse.json();
        debugLog('User created successfully', { userId: newUser.id, requestId });
        return NextResponse.json(newUser);
      }

      // 重複エラーの場合は、ユーザーが既に作成されていると判断
      const responseText = await createResponse.text();
      debugLog('User creation failed', {
        status: createResponse.status,
        responseText,
        requestId
      });

      if (createResponse.status === 500 && responseText.includes('duplicate key')) {
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
          return NextResponse.json(retryUser);
        }
      }

      return NextResponse.json({ 
        error: 'ユーザーの作成に失敗しました',
        details: responseText
      }, { status: 500 });
    }

    // その他のエラーの場合
    const errorText = await response.text();
    debugLog('Backend error', {
      status: response.status,
      errorText,
      requestId
    });

    return NextResponse.json({ 
      error: 'ユーザー情報の取得に失敗しました',
      details: errorText
    }, { status: response.status });

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