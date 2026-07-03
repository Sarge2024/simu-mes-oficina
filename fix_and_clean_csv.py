import os

def fix_and_clean_csv(file_path):
    print(f"🛠️ Corrigindo e limpando arquivo: {file_path}")
    
    if not os.path.exists(file_path):
        print(f"❌ Arquivo não encontrado: {file_path}")
        return

    try:
        # 1. Lê os bytes crus
        with open(file_path, 'rb') as f:
            raw_data = f.read()

        # 2. Remoção agressiva de espaços fantasmas (32, char, 32, char...)
        if len(raw_data) > 10 and raw_data[0] == 32 and raw_data[2] == 32:
            print("ℹ️ Detectado padrão de espaços intercalados. Removendo...")
            raw_data = raw_data[1::2]

        # 3. Decodifica
        try:
            text = raw_data.decode('utf-8')
        except:
            text = raw_data.decode('latin-1')

        # 4. Normalização de caracteres
        replacements = {
            'Á': 'A', 'À': 'A', 'Ã': 'A', 'Â': 'A', 'Ä': 'A',
            'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
            'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
            'Ó': 'O', 'Ò': 'O', 'Õ': 'O', 'Ô': 'O', 'Ö': 'O',
            'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U',
            'Ç': 'C', 'Ñ': 'N',
            'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
            'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
            'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
            'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
            'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
            'ç': 'c', 'ñ': 'n'
        }

        for old, new in replacements.items():
            text = text.replace(old, new)

        # 5. Salva como UTF-8
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(text)
            
        print("✨ Arquivo finalizado!")

    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    target_csv = "/mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES Oficina/Lista veiculos 2.CSV"
    fix_and_clean_csv(target_csv)
