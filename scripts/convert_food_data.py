import pandas as pd
import json
import os
import logging
import re
from typing import Dict, Any, Optional

# ロギングの設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_nutrient_value(value: Any) -> float:
    """栄養素の値を解析して数値に変換"""
    if pd.isna(value):
        return 0.0
    
    # 文字列に変換
    str_value = str(value).strip()
    
    # 空文字列や'-'の場合は0を返す
    if str_value in ['', '-', 'Tr']:
        return 0.0
    
    # 括弧付きの数値を処理
    match = re.match(r'\(([\d.]+)\)', str_value)
    if match:
        return float(match.group(1))
    
    # 通常の数値に変換
    try:
        return float(str_value)
    except ValueError:
        logger.warning(f"Could not convert value '{str_value}' to float, using 0.0")
        return 0.0

def validate_data(df: pd.DataFrame) -> bool:
    """データの検証を行う"""
    # データが空でないか確認
    if df.empty:
        logger.error("Excel file is empty")
        return False
    
    return True

def get_food_key(name: str, category: str) -> str:
    """食品の一意のキーを生成"""
    return f"{name}_{category}"

def convert_row_to_food_data(row: pd.Series) -> Optional[Dict[str, Any]]:
    """行データを食品データに変換"""
    try:
        # 食品名が空の場合はスキップ
        if pd.isna(row[3]):  # 食品名の列番号を修正
            return None
        
        # 食品名と分類を取得
        name = str(row[3])
        category = str(row[2]) if not pd.isna(row[2]) else "その他"
            
        return {
            'name': name,
            'category': category,
            'calories': parse_nutrient_value(row[5]),  # エネルギー
            'protein': parse_nutrient_value(row[8]),  # たんぱく質
            'fat': parse_nutrient_value(row[9]),  # 脂質
            'carbohydrates': parse_nutrient_value(row[10]),  # 炭水化物
            'salt': parse_nutrient_value(row[60])  # 食塩相当量
        }
    except Exception as e:
        logger.error(f"Error converting row data: {e}")
        return None

def convert_food_data():
    """ExcelファイルをJSONに変換"""
    try:
        # 入力ファイルと出力ファイルのパス
        input_file = os.path.join('data', '02_本表.xlsx')
        output_file = os.path.join('..', 'frontend', 'app', 'utils', 'foodData.json')
        
        logger.info(f"Reading Excel file: {input_file}")
        # ヘッダー行を指定せずに読み込み
        df = pd.read_excel(input_file, sheet_name='表全体', header=None)
        
        # データの検証
        if not validate_data(df):
            return
        
        # データを整形（4行目以降が実際のデータ）
        food_data = {}
        for _, row in df.iloc[3:].iterrows():
            food_item = convert_row_to_food_data(row)
            if food_item:
                # 食品名と分類を組み合わせて一意のキーを生成
                key = get_food_key(food_item['name'], food_item['category'])
                food_data[key] = food_item
        
        # 出力ディレクトリの確認と作成
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        # JSONファイルとして保存
        logger.info(f"Writing JSON file: {output_file}")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(food_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Successfully converted {len(food_data)} food items")
        
    except Exception as e:
        logger.error(f"Error during conversion: {e}")
        raise

if __name__ == '__main__':
    convert_food_data() 