import pandas as pd

# Excelファイルを読み込む
excel_file = 'data/02_本表.xlsx'
xl = pd.ExcelFile(excel_file)

# シート名を表示
print("利用可能なシート名:")
for sheet_name in xl.sheet_names:
    print(f"- {sheet_name}") 