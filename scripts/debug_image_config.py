#!/usr/bin/env python3
"""
本番環境での画像設定デバッグスクリプト

使用方法:
python debug_image_config.py

このスクリプトは、Cloudflare R2の設定と画像URLの生成をテストします。
"""

import os
import requests
import json
from urllib.parse import urlparse

def check_environment_variables():
    """環境変数の確認"""
    print("=== 環境変数チェック ===")
    
    required_vars = [
        'CLOUDFLARE_R2_ACCOUNT_ID',
        'CLOUDFLARE_R2_ACCESS_KEY_ID', 
        'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
        'CLOUDFLARE_R2_ENDPOINT',
        'CLOUDFLARE_R2_BUCKET_NAME',
        'CLOUDFLARE_R2_PUBLIC_URL'
    ]
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            # 機密情報は一部マスク
            if 'KEY' in var or 'SECRET' in var:
                masked_value = value[:4] + "***" + value[-4:] if len(value) > 8 else "***"
                print(f"✅ {var}: {masked_value}")
            else:
                print(f"✅ {var}: {value}")
        else:
            print(f"❌ {var}: 未設定")
    
    print()

def test_r2_public_url():
    """R2の公開URLのテスト"""
    print("=== R2公開URLテスト ===")
    
    public_url = os.getenv('CLOUDFLARE_R2_PUBLIC_URL')
    if not public_url:
        print("❌ CLOUDFLARE_R2_PUBLIC_URLが設定されていません")
        return
    
    # テスト用の画像パス
    test_paths = [
        'ingredients/potato.webp',
        'ingredients/1.jpg',
        'recipes/test-recipe/main.jpg'
    ]
    
    for test_path in test_paths:
        full_url = f"{public_url}/{test_path}"
        print(f"テストURL: {full_url}")
        
        try:
            response = requests.head(full_url, timeout=10)
            if response.status_code == 200:
                print(f"✅ {test_path}: アクセス可能 (200)")
            elif response.status_code == 404:
                print(f"⚠️  {test_path}: ファイルが存在しません (404)")
            else:
                print(f"❌ {test_path}: エラー ({response.status_code})")
        except requests.exceptions.RequestException as e:
            print(f"❌ {test_path}: リクエストエラー - {e}")
    
    print()

def test_nextjs_image_config():
    """Next.jsの画像設定テスト"""
    print("=== Next.js画像設定テスト ===")
    
    # 本番環境のリモートパターン
    production_patterns = [
        {
            "protocol": "https",
            "hostname": "amarimono-backend.onrender.com",
            "port": "",
            "pathname": "/uploads/**",
        },
        {
            "protocol": "https", 
            "hostname": "api.okamura.dev",
            "port": "",
            "pathname": "/uploads/**",
        },
        {
            "protocol": "https",
            "hostname": "qmrjsqeigdkizkrpiahs.supabase.co",
            "port": "",
            "pathname": "/storage/v1/object/public/images/**",
        },
        {
            "protocol": "https",
            "hostname": "pub-a63f718fe8894565998a27328e2d1b15.r2.dev",
            "port": "",
            "pathname": "/**",
        }
    ]
    
    print("本番環境のリモートパターン:")
    for i, pattern in enumerate(production_patterns, 1):
        print(f"{i}. {pattern['protocol']}://{pattern['hostname']}{pattern['pathname']}")
    
    print()
    
    # テストURLの検証
    test_urls = [
        "https://pub-a63f718fe8894565998a27328e2d1b15.r2.dev/ingredients/potato.webp",
        "https://qmrjsqeigdkizkrpiahs.supabase.co/storage/v1/object/public/images/ingredients/potato.webp"
    ]
    
    for test_url in test_urls:
        print(f"テストURL: {test_url}")
        parsed = urlparse(test_url)
        
        # パターンマッチングのテスト
        matched = False
        for pattern in production_patterns:
            if (pattern['protocol'] == parsed.scheme and 
                pattern['hostname'] == parsed.hostname and
                (pattern['port'] == '' or pattern['port'] == str(parsed.port))):
                
                # パス名のマッチング（簡易版）
                if pattern['pathname'].endswith('/**'):
                    base_path = pattern['pathname'][:-2]
                    if parsed.path.startswith(base_path):
                        matched = True
                        break
                elif pattern['pathname'] == parsed.path:
                    matched = True
                    break
        
        if matched:
            print(f"✅ パターンマッチ: 許可されるURL")
        else:
            print(f"❌ パターンマッチ: 拒否されるURL")
        
        # 実際のアクセステスト
        try:
            response = requests.head(test_url, timeout=10)
            print(f"   実際のアクセス: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"   実際のアクセス: エラー - {e}")
        
        print()

def test_image_url_generation():
    """画像URL生成のテスト"""
    print("=== 画像URL生成テスト ===")
    
    public_url = os.getenv('CLOUDFLARE_R2_PUBLIC_URL')
    if not public_url:
        print("❌ CLOUDFLARE_R2_PUBLIC_URLが設定されていません")
        return
    
    test_cases = [
        ('ingredients/potato.webp', '具材画像'),
        ('recipes/test-recipe/main.jpg', 'レシピメイン画像'),
        ('users/user123/profile.jpg', 'ユーザープロフィール画像'),
        ('ingredients/1.jpg', '具材画像（数値ID）')
    ]
    
    for src, description in test_cases:
        generated_url = f"{public_url}/{src}"
        print(f"{description}:")
        print(f"  src: {src}")
        print(f"  URL: {generated_url}")
        
        # URLの妥当性チェック
        parsed = urlparse(generated_url)
        if parsed.scheme and parsed.hostname:
            print(f"  ✅ URL形式: 妥当")
        else:
            print(f"  ❌ URL形式: 不正")
        
        print()

def main():
    """メイン関数"""
    print("🔍 本番環境画像設定デバッグ")
    print("=" * 50)
    
    check_environment_variables()
    test_r2_public_url()
    test_nextjs_image_config()
    test_image_url_generation()
    
    print("=" * 50)
    print("デバッグ完了")

if __name__ == "__main__":
    main() 