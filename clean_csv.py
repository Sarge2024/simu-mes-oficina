import os

def clean_csv(file_path):
    print(f"🧹 Iniciando limpeza do arquivo: {file_path}")
    
    if not os.path.exists(file_path):
        print(f"❌ Arquivo não encontrado: {file_path}")
        return

    # Mapeamento de substituições comuns baseadas no que foi visto
    replacements = {
        '': 'O', # Geralmente AUTOMVEIS -> AUTOMOVEIS
        'AUTOMVEIS': 'AUTOMOVEIS',
        'UTILITRIOS': 'UTILITARIOS',
        'CAMINHES': 'CAMINHOES',
        'NIBUS': 'ONIBUS',
        'FABRICANTE': 'FABRICANTE',
        'Cd.': 'Cod.',
        'Combustivel': 'Combustivel'
    }

    try:
        # Tenta ler como latin-1 que é o mais comum nesses CSVs legados
        with open(file_path, 'r', encoding='latin-1') as f:
            content = f.read()

        # Aplica substituições
        new_content = content
        
        # Substituições específicas de palavras conhecidas para garantir precisão
        new_content = new_content.replace('AUTOMVEIS', 'AUTOMOVEIS')
        new_content = new_content.replace('UTILITRIOS', 'UTILITARIOS')
        new_content = new_content.replace('CAMINHES', 'CAMINHOES')
        new_content = new_content.replace('NIBUS', 'ONIBUS')
        new_content = new_content.replace('Cd.', 'Cod.')
        
        # Substituição genérica do caractere de interrogação/erro
        new_content = new_content.replace('', ' ') # Remove o que sobrar de estranho

        # Salva o arquivo de volta em UTF-8 para evitar problemas futuros
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
        print("✨ Arquivo limpo e convertido para UTF-8 com sucesso!")

    except Exception as e:
        print(f"❌ Erro ao processar o arquivo: {e}")

if __name__ == "__main__":
    target_csv = "/mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES Oficina/Lista veiculos 2.CSV"
    clean_csv(target_csv)
