#!/usr/bin/env python3
"""
Cloudflare R2の使用量を確認するスクリプト

使用方法:
python check_r2_usage.py

このスクリプトは、Cloudflare R2の使用量と制限を確認します。
"""

import os
import requests
import json
from datetime import datetime, timedelta

def check_r2_usage():
    """R2の使用量を確認"""
    print("=== Cloudflare R2 使用量確認 ===")
    
    # 環境変数から認証情報を取得
    account_id = os.getenv('CLOUDFLARE_R2_ACCOUNT_ID')
    api_token = os.getenv('CLOUDFLARE_API_TOKEN')  # 新しい環境変数が必要
    
    if not account_id:
        print("❌ CLOUDFLARE_R2_ACCOUNT_IDが設定されていません")
        return
    
    if not api_token:
        print("❌ CLOUDFLARE_API_TOKENが設定されていません")
        print("CloudflareダッシュボードでAPIトークンを作成してください")
        return
    
    # 現在の月の使用量を取得
    current_date = datetime.now()
    start_date = current_date.replace(day=1).strftime('%Y-%m-%d')
    end_date = current_date.strftime('%Y-%m-%d')
    
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/analytics/storage"
    
    headers = {
        'Authorization': f'Bearer {api_token}',
        'Content-Type': 'application/json'
    }
    
    params = {
        'start': start_date,
        'end': end_date,
        'dimensions': 'service'
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API呼び出し成功")
            print(f"期間: {start_date} から {end_date}")
            print()
            
            if data.get('result'):
                for result in data['result']:
                    service = result.get('service', 'Unknown')
                    storage_gb = result.get('storage_gb', 0)
                    requests_count = result.get('requests_count', 0)
                    
                    print(f"サービス: {service}")
                    print(f"ストレージ使用量: {storage_gb:.2f} GB")
                    print(f"リクエスト数: {requests_count:,} 回")
                    print()
                    
                    # 制限との比較
                    if service == 'R2':
                        print("=== 制限との比較 ===")
                        print(f"ストレージ制限: 10 GB")
                        print(f"Class A操作制限: 1,000,000 回/月")
                        print()
                        
                        if storage_gb > 10:
                            print("⚠️  ストレージ制限を超過しています")
                        else:
                            print("✅ ストレージ使用量は制限内です")
                        
                        if requests_count > 1000000:
                            print("⚠️  Class A操作制限を超過しています")
                        else:
                            print("✅ Class A操作数は制限内です")
            else:
                print("データが見つかりませんでした")
        else:
            print(f"❌ API呼び出し失敗: {response.status_code}")
            print(f"レスポンス: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ リクエストエラー: {e}")

def check_r2_bucket_contents():
    """R2バケットの内容を確認"""
    print("\n=== R2バケット内容確認 ===")
    
    bucket_name = os.getenv('CLOUDFLARE_R2_BUCKET_NAME')
    public_url = os.getenv('CLOUDFLARE_R2_PUBLIC_URL')
    
    if not bucket_name:
        print("❌ CLOUDFLARE_R2_BUCKET_NAMEが設定されていません")
        return
    
    if not public_url:
        print("❌ CLOUDFLARE_R2_PUBLIC_URLが設定されていません")
        return
    
    print(f"バケット名: {bucket_name}")
    print(f"公開URL: {public_url}")
    
    # テスト用の画像パス
    test_paths = [
        'ingredients/chive.webp',
        'ingredients/potato.webp',
        'recipes/test-recipe/main.jpg'
    ]
    
    print("\n画像アクセステスト:")
    for test_path in test_paths:
        full_url = f"{public_url}/{test_path}"
        try:
            response = requests.head(full_url, timeout=10)
            if response.status_code == 200:
                print(f"✅ {test_path}: アクセス可能")
            elif response.status_code == 402:
                print(f"❌ {test_path}: 402 Payment Required (課金制限)")
            elif response.status_code == 404:
                print(f"⚠️  {test_path}: ファイルが存在しません")
            else:
                print(f"❌ {test_path}: エラー ({response.status_code})")
        except requests.exceptions.RequestException as e:
            print(f"❌ {test_path}: リクエストエラー - {e}")

def check_environment_variables():
    """環境変数の確認"""
    print("=== 環境変数確認 ===")
    
    required_vars = [
        'CLOUDFLARE_R2_ACCOUNT_ID',
        'CLOUDFLARE_R2_ACCESS_KEY_ID',
        'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
        'CLOUDFLARE_R2_BUCKET_NAME',
        'CLOUDFLARE_R2_PUBLIC_URL'
    ]
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            if 'KEY' in var or 'SECRET' in var:
                masked_value = value[:4] + "***" + value[-4:] if len(value) > 8 else "***"
                print(f"✅ {var}: {masked_value}")
            else:
                print(f"✅ {var}: {value}")
        else:
            print(f"❌ {var}: 未設定")
    
    # APIトークンの確認
    api_token = os.getenv('CLOUDFLARE_API_TOKEN')
    if api_token:
        masked_token = api_token[:4] + "***" + api_token[-4:] if len(api_token) > 8 else "***"
        print(f"✅ CLOUDFLARE_API_TOKEN: {masked_token}")
    else:
        print("❌ CLOUDFLARE_API_TOKEN: 未設定")
        print("   CloudflareダッシュボードでAPIトークンを作成してください")

def main():
    """メイン関数"""
    print("🔍 Cloudflare R2 使用量確認ツール")
    print("=" * 50)
    
    check_environment_variables()
    print()
    check_r2_usage()
    print()
    check_r2_bucket_contents()
    
    print("\n" + "=" * 50)
    print("確認完了")
    print("\n注意: 使用量の詳細確認には、Cloudflare APIトークンが必要です")
    print("APIトークンの作成方法:")
    print("1. Cloudflareダッシュボードにログイン")
    print("2. My Profile → API Tokens")
    print("3. Create Token → Custom token")
    print("4. 権限: Account > Analytics > Read")

if __name__ == "__main__":
    main() 