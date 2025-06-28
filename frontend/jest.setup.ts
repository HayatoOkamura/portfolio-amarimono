import '@testing-library/jest-dom';

// 環境変数の設定
process.env.NEXT_PUBLIC_PROD_SUPABASE_URL = 'https://mock.supabase.co';
process.env.NEXT_PUBLIC_PROD_SUPABASE_ANON_KEY = 'mock-key';
process.env.NEXT_PUBLIC_BACKEND_INTERNAL_URL = 'http://localhost:3001';

// Next.jsのAPIルートのテストに必要なグローバルオブジェクト
global.Request = class Request {
  private _url: string;
  private _method: string;
  private _headers: Headers;

  constructor(url: string, init?: RequestInit) {
    this._url = url;
    this._method = init?.method || 'GET';
    this._headers = new Headers(init?.headers);
  }

  get url() {
    return this._url;
  }

  get method() {
    return this._method;
  }

  get headers() {
    return this._headers;
  }
} as any;

global.Headers = class Headers {
  private headers: Map<string, string>;

  constructor(init?: Record<string, string>) {
    this.headers = new Map();
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value);
      });
    }
  }

  get(name: string): string | null {
    return this.headers.get(name.toLowerCase()) || null;
  }

  entries(): IterableIterator<[string, string]> {
    return this.headers.entries();
  }

  forEach(callback: (value: string, key: string) => void): void {
    this.headers.forEach((value, key) => callback(value, key));
  }

  has(name: string): boolean {
    return this.headers.has(name.toLowerCase());
  }

  set(name: string, value: string): void {
    this.headers.set(name.toLowerCase(), value);
  }

  delete(name: string): void {
    this.headers.delete(name.toLowerCase());
  }
} as any;