import csv
import os
from decimal import Decimal

def clean_currency(value):
    if not value or value.strip() == '':
        return None
    # Remove R$, dots and replace comma with dot
    clean_val = value.replace('R$', '').replace('.', '').replace(',', '.').strip()
    try:
        return Decimal(clean_val)
    except:
        return None

def analyze():
    csv_path = '/mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES Oficina/Lista veiculos 2.CSV'
    
    with open(csv_path, mode='r', encoding='latin-1') as f:
        reader = csv.DictReader(f, delimiter=';')
        
        count = 0
        for row in reader:
            if count == 0:
                print(f"Available keys: {row.keys()}")
            
            if count >= 5: break
            
            print(f"Row {count + 1}:")
            print(f"  Fabricante: {row.get('Fabricante')}")
            # Try to find the code column flexibly
            code_col = [k for k in row.keys() if 'd.' in k][0]
            print(f"  Codigo ({code_col}): {row.get(code_col)}")
            print(f"  Modelo/Versao: {row['Modelo']}")
            print(f"  Combustivel: {row['Combustivel']}")
            
            years = [str(y) for y in range(2002, 2017)]
            for y in years:
                val = clean_currency(row.get(y))
                if val:
                    print(f"    Year {y}: {val}")
            
            count += 1

if __name__ == "__main__":
    analyze()
