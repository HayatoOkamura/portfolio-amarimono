import pandas as pd

# Excelファイルを読み込む
excel_file = 'data/02_本表.xlsx'
df = pd.read_excel(excel_file, sheet_name='表全体', header=None)

# 最初の10行を表示してデータの構造を確認
print("\nデータの最初の10行:")
print(df.head(10))

# 各列の最初の数行の値を表示
print("\n各列の最初の数行の値:")
for i in range(min(10, len(df.columns))):
    print(f"\n列 {i}:")
    print(df[i].head(10)) 