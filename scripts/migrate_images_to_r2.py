#!/usr/bin/env python3
"""
Supabase StorageからCloudflare R2への画像移行スクリプト

使用方法:
1. 環境変数を設定
2. python migrate_images_to_r2.py

必要な環境変数:
- CLOUDFLARE_R2_ACCOUNT_ID
- CLOUDFLARE_R2_ACCESS_KEY_ID
- CLOUDFLARE_R2_SECRET_ACCESS_KEY
- CLOUDFLARE_R2_ENDPOINT
- CLOUDFLARE_R2_BUCKET_NAME
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
"""

import os
import requests
import boto3
from botocore.config import Config
import json
import time
import logging
from urllib.parse import urlparse
from typing import List, Dict, Optional

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ImageMigrator:
    def __init__(self):
        self.r2_client = self._init_r2_client()
        self.bucket_name = os.getenv('CLOUDFLARE_R2_BUCKET_NAME')
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not all([self.r2_client, self.bucket_name, self.supabase_url, self.supabase_key]):
            raise ValueError("必要な環境変数が設定されていません")

    def _init_r2_client(self):
        """R2クライアントを初期化"""
        try:
            return boto3.client(
                's3',
                endpoint_url=os.getenv('CLOUDFLARE_R2_ENDPOINT'),
                aws_access_key_id=os.getenv('CLOUDFLARE_R2_ACCESS_KEY_ID'),
                aws_secret_access_key=os.getenv('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
                config=Config(signature_version='s3v4'),
                region_name='auto'
            )
        except Exception as e:
            logger.error(f"R2クライアントの初期化に失敗: {e}")
            return None

    def get_supabase_images(self) -> List[Dict]:
        """Supabaseから画像情報を取得"""
        images = []
        
        # 具材の画像
        try:
            response = requests.get(
                f"{self.supabase_url}/rest/v1/ingredients?select=id,image_url",
                headers={
                    'apikey': self.supabase_key,
                    'Authorization': f'Bearer {self.supabase_key}'
                }
            )
            if response.status_code == 200:
                ingredients = response.json()
                for ingredient in ingredients:
                    if ingredient.get('image_url'):
                        images.append({
                            'type': 'ingredient',
                            'id': ingredient['id'],
                            'path': ingredient['image_url'],
                            'table': 'ingredients',
                            'column': 'image_url'
                        })
        except Exception as e:
            logger.error(f"具材画像の取得に失敗: {e}")

        # レシピの画像
        try:
            response = requests.get(
                f"{self.supabase_url}/rest/v1/recipes?select=id,image_url",
                headers={
                    'apikey': self.supabase_key,
                    'Authorization': f'Bearer {self.supabase_key}'
                }
            )
            if response.status_code == 200:
                recipes = response.json()
                for recipe in recipes:
                    if recipe.get('image_url'):
                        images.append({
                            'type': 'recipe',
                            'id': recipe['id'],
                            'path': recipe['image_url'],
                            'table': 'recipes',
                            'column': 'image_url'
                        })
        except Exception as e:
            logger.error(f"レシピ画像の取得に失敗: {e}")

        # ユーザーのプロフィール画像
        try:
            response = requests.get(
                f"{self.supabase_url}/rest/v1/users?select=id,profile_image",
                headers={
                    'apikey': self.supabase_key,
                    'Authorization': f'Bearer {self.supabase_key}'
                }
            )
            if response.status_code == 200:
                users = response.json()
                for user in users:
                    if user.get('profile_image'):
                        images.append({
                            'type': 'user',
                            'id': user['id'],
                            'path': user['profile_image'],
                            'table': 'users',
                            'column': 'profile_image'
                        })
        except Exception as e:
            logger.error(f"ユーザー画像の取得に失敗: {e}")

        return images

    def download_from_supabase(self, image_path: str) -> Optional[bytes]:
        """Supabaseから画像をダウンロード"""
        try:
            # Supabase StorageのURLを構築
            supabase_storage_url = f"{self.supabase_url}/storage/v1/object/public/images/{image_path}"
            
            response = requests.get(supabase_storage_url, timeout=30)
            if response.status_code == 200:
                return response.content
            else:
                logger.warning(f"画像のダウンロードに失敗: {supabase_storage_url} (ステータス: {response.status_code})")
                return None
        except Exception as e:
            logger.error(f"画像のダウンロード中にエラー: {e}")
            return None

    def upload_to_r2(self, image_path: str, image_content: bytes, content_type: str = 'image/jpeg') -> bool:
        """R2に画像をアップロード"""
        try:
            self.r2_client.put_object(
                Bucket=self.bucket_name,
                Key=image_path,
                Body=image_content,
                ContentType=content_type
            )
            logger.info(f"R2にアップロード成功: {image_path}")
            return True
        except Exception as e:
            logger.error(f"R2へのアップロードに失敗: {image_path} - {e}")
            return False

    def update_database_path(self, table: str, column: str, record_id: str, new_path: str) -> bool:
        """データベースのパスを更新"""
        try:
            response = requests.patch(
                f"{self.supabase_url}/rest/v1/{table}?id=eq.{record_id}",
                headers={
                    'apikey': self.supabase_key,
                    'Authorization': f'Bearer {self.supabase_key}',
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                json={column: new_path}
            )
            
            if response.status_code == 204:
                logger.info(f"データベース更新成功: {table}.{column} = {record_id}")
                return True
            else:
                logger.error(f"データベース更新失敗: {table}.{column} = {record_id} (ステータス: {response.status_code})")
                return False
        except Exception as e:
            logger.error(f"データベース更新中にエラー: {e}")
            return False

    def migrate_images(self, dry_run: bool = False):
        """画像の移行を実行"""
        logger.info("画像移行を開始します")
        
        # 移行対象の画像を取得
        images = self.get_supabase_images()
        logger.info(f"移行対象画像数: {len(images)}")
        
        if dry_run:
            logger.info("ドライランモード: 実際の移行は実行されません")
            for image in images:
                logger.info(f"移行対象: {image['type']} - {image['path']}")
            return
        
        success_count = 0
        error_count = 0
        
        for i, image in enumerate(images, 1):
            logger.info(f"処理中 ({i}/{len(images)}): {image['path']}")
            
            try:
                # Supabaseからダウンロード
                image_content = self.download_from_supabase(image['path'])
                if not image_content:
                    logger.warning(f"ダウンロード失敗: {image['path']}")
                    error_count += 1
                    continue
                
                # コンテンツタイプを判定
                content_type = 'image/jpeg'  # デフォルト
                if image['path'].lower().endswith('.png'):
                    content_type = 'image/png'
                elif image['path'].lower().endswith('.gif'):
                    content_type = 'image/gif'
                elif image['path'].lower().endswith('.webp'):
                    content_type = 'image/webp'
                
                # R2にアップロード
                if self.upload_to_r2(image['path'], image_content, content_type):
                    # データベースを更新
                    if self.update_database_path(image['table'], image['column'], image['id'], image['path']):
                        success_count += 1
                        logger.info(f"移行成功: {image['path']}")
                    else:
                        error_count += 1
                        logger.error(f"データベース更新失敗: {image['path']}")
                else:
                    error_count += 1
                
                # レート制限を避けるため少し待機
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"移行中にエラー: {image['path']} - {e}")
                error_count += 1
        
        logger.info(f"移行完了: 成功 {success_count}, 失敗 {error_count}")

def main():
    """メイン関数"""
    try:
        migrator = ImageMigrator()
        
        # ドライランの確認
        dry_run = input("ドライランを実行しますか？ (y/N): ").lower() == 'y'
        
        # 移行実行
        migrator.migrate_images(dry_run=dry_run)
        
    except Exception as e:
        logger.error(f"移行スクリプトの実行に失敗: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 