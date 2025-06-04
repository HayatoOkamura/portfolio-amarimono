import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントのモック
const mockGetUser = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser
    }
  }))
}));

// モック用の定数
const MOCK_SUPABASE_URL = 'https://mock.supabase.co';
const MOCK_SUPABASE_KEY = 'mock-key';

// fetchのモック
global.fetch = jest.fn();

describe('POST /api/auth/sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常系: ユーザーが存在する場合', async () => {
    // モックの設定
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString()
    };

    // Supabaseのモック
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null
    });

    // バックエンドAPIのモック
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: mockUser.id, email: mockUser.email })
    });

    // リクエストの作成
    const request = new NextRequest('http://localhost:3000/api/auth/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    // テスト実行
    const response = await POST(request);
    const data = await response.json();

    // アサーション
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id', mockUser.id);
    expect(data).toHaveProperty('email', mockUser.email);
  });

  it('異常系: 認証トークンが無効な場合', async () => {
    // Supabaseのモック
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Invalid token')
    });

    // リクエストの作成
    const request = new NextRequest('http://localhost:3000/api/auth/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

    // テスト実行
    const response = await POST(request);
    const data = await response.json();

    // アサーション
    expect(response.status).toBe(401);
    expect(data).toHaveProperty('error');
  });

  it('異常系: メール認証が完了していない場合', async () => {
    // モックの設定
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      email_confirmed_at: null
    };

    // Supabaseのモック
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null
    });

    // リクエストの作成
    const request = new NextRequest('http://localhost:3000/api/auth/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    // テスト実行
    const response = await POST(request);
    const data = await response.json();

    // アサーション
    expect(response.status).toBe(403);
    expect(data).toHaveProperty('error', 'メール認証が完了していません');
  });

  it('異常系: バックエンドAPIがエラーを返す場合', async () => {
    // モックの設定
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString()
    };

    // Supabaseのモック
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null
    });

    // バックエンドAPIのモック
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Not Found')
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error')
      });

    // リクエストの作成
    const request = new NextRequest('http://localhost:3000/api/auth/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    // テスト実行
    const response = await POST(request);
    const data = await response.json();

    // アサーション
    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error', 'ユーザーの作成に失敗しました');
  });
}); 