import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    console.log('Starting sync process...');
    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_PROD_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_PROD_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          storageKey: 'sb-auth-token',
          storage: {
            getItem: (key: string): string | null => {
              try {
                const cookie = cookieStore.get(key)?.value
                console.log(`Getting cookie for key ${key}:`, cookie ? 'Found' : 'Not found');
                return cookie || null
              } catch (error) {
                console.error('Error getting cookie:', error);
                return null;
              }
            },
            setItem: (key: string, value: string): void => {
              try {
                cookieStore.set(key, value, {
                  path: '/',
                  maxAge: 3600,
                  secure: true,
                  sameSite: 'lax',
                  httpOnly: true,
                })
                console.log(`Setting cookie for key ${key}`);
              } catch (error) {
                console.error('Error setting cookie:', error);
              }
            },
            removeItem: (key: string): void => {
              try {
                cookieStore.delete(key)
                console.log(`Removing cookie for key ${key}`);
              } catch (error) {
                console.error('Error removing cookie:', error);
              }
            },
          },
        },
      }
    )

    // セッションの取得
    console.log('Fetching session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Session data:', JSON.stringify(session, null, 2));
    console.log('Session error:', sessionError);

    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'セッションの取得に失敗しました' }, { status: 401 })
    }

    if (!session) {
      console.error('No session found');
      return NextResponse.json({ error: '認証セッションが見つかりません' }, { status: 401 })
    }

    // メール認証が完了していない場合はエラーを返す
    if (!session.user.email_confirmed_at) {
      console.log('Email not confirmed');
      return NextResponse.json({ error: 'メール認証が完了していません' }, { status: 403 })
    }

    // ユーザー情報の取得
    console.log('Fetching user data for ID:', session.user.id);
    try {
      const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_INTERNAL_URL}/api/users/${session.user.id}`;
      
      console.log('Environment variables:', {
        BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_INTERNAL_URL,
        NODE_ENV: process.env.NODE_ENV
      });
      console.log('Request URL:', backendUrl);

      // バックエンドAPIを使用してユーザー情報を取得
      let response;
      try {
        console.log('Attempting to fetch from backend...');
        response = await fetch(backendUrl, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          // 明示的にタイムアウトを設定
          signal: AbortSignal.timeout(5000),
        });
        console.log('Fetch successful, status:', response.status);
      } catch (error) {
        console.error('Fetch error:', error);
        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
          });
        }
        throw new Error('Failed to connect to backend service');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        if (response.status === 404) {
          // ユーザーが存在しない場合は新規作成
          console.log('User not found, creating new user...');
          const userData = {
            id: session.user.id,
            email: session.user.email || '',
            age: 0,
            gender: "未設定"
          };

          const createResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_INTERNAL_URL}/api/users`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });

          if (!createResponse.ok) {
            const error = await createResponse.json();
            console.error('Error creating user:', error);
            return NextResponse.json({ 
              error: 'ユーザーの作成に失敗しました',
              details: error
            }, { status: 500 });
          }

          const newUser = await createResponse.json();
          console.log('New user created:', JSON.stringify(newUser, null, 2));
          return NextResponse.json(newUser);
        }

        const error = await response.json();
        console.error('Error fetching user:', error);
        return NextResponse.json({ 
          error: 'ユーザー情報の取得に失敗しました',
          details: error
        }, { status: response.status });
      }

      const user = await response.json();
      console.log('Existing user found:', JSON.stringify(user, null, 2));
      return NextResponse.json(user);
    } catch (error) {
      console.error('Error in database operation:', error);
      return NextResponse.json({ 
        error: 'データベース操作中にエラーが発生しました',
        details: error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in sync:', error);
    return NextResponse.json({ 
      error: '予期せぬエラーが発生しました',
      details: error
    }, { status: 500 });
  }
} 