import django
import sys
import os

sys.path.append('/mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES Oficina/backend/django_app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from veiculos.models import Marca, Motor
from catalogo.models import Componente, ReferenciaFabricante, AplicacaoMotor

# 1. MARCAS
marcas = [
    'FIAT', 'FORD', 'GM - CHEVROLET', 'HONDA', 'PEUGEOT', 
    'RENAULT', 'VOLKSWAGEN', 'SEAT', 'IVECO', 'GURGEL', 'BRASVED'
]

print("Inserindo Marcas...")
for nome in marcas:
    Marca.objects.get_or_create(nome_marca=nome)

# 2. MOTORES
# Map IDs to actual natural keys to resolve them easily later
motores_map = {
    11: ('FIASA', '1.0/1.050', '8V'),
    12: ('146C7 / 146A5', '1.3/1.5', '8V'),
    13: ('SEVEL', '1.6/2.0', '8V'),
    14: ('835C1 / 185', '1.6/1.8/2.0', '16V'),
    15: ('FIRE', '1.0', '8V'),
    16: ('192 A2 (Marea/Stilo)', '2.0/2.4', '20V'),
    17: ('8140.43 (Ducato)', '2.8', 'DIESEL'),
    21: ('CHT / AE', '1.0/1.6', '8V'),
    22: ('AP', '1.8/2.0', '8V'),
    23: ('OHV (HCS)', '1.0/1.3', '8V'),
    24: ('ZETEC', '1.8/2.0', '16V'),
    25: ('D229 (F4000)', '4.0/6.0', 'DIESEL'),
    31: ('OHC 1ª Geração', '1.6/1.8', '8V'),
    32: ('OHC 2ª Geração', '1.0 a 2.2', '8V/16V'),
    33: ('Perkins / Q20B4', '4.236/6.358', 'DIESEL'),
    41: ('B16 / EK / EL', '1.6/1.8/2.0', '16V'),
    42: ('F18 / F20 / F22', '2.2/2.3', 'VTEC'),
    43: ('C32 / C35', '3.2/3.5', 'V6 16V'),
    51: ('TU1 / TU3 / TU5', '1.0/1.2/1.4', '8V'),
    52: ('TU5JP', '1.6', '8V/16V'),
    53: ('XU7 / XU9 / XU10', '1.8/1.9/2.0', '8V/16V'),
    54: ('XUD7 / XUD9', '1.8/1.9', 'DIESEL'),
    61: ('D7F / K7M / E7J', '1.1 a 1.6', '8V'),
    62: ('F2N / F3R / F3N', '1.8/2.0', '8V'),
    63: ('J8S', '2.1', 'DIESEL'),
    64: ('F7P / F7R', '1.8/2.0', '16V'),
    71: ('Boxer a Ar', '1.3/1.5/1.6', '8V'),
    72: ('AT', '1.0', '16V'),
    73: ('EA111', '1.0', '8V/16V'),
    74: ('ABA / AKR / ABF', '2.8', 'VR6')
}

print("Inserindo Motores...")
for m_id, (familia, cil, valv) in motores_map.items():
    Motor.objects.get_or_create(
        codigo_familia=familia, 
        cilindradas=cil, 
        valvulas=valv
    )

# 3. COMPONENTES
componentes_map = {
    1: ('RET-HST-001', 'RETENTOR', 'Retentor Haste de Válvula', '8,00x10,90x10,00'),
    2: ('RET-HST-002', 'RETENTOR', 'Retentor Haste de Válvula', '7,00x9,00x10,00'),
    3: ('RET-HST-003', 'RETENTOR', 'Retentor Haste de Válvula', '7,00x11,00x10,00'),
    4: ('RET-HST-004', 'RETENTOR', 'Retentor Haste de Válvula', '8,00x12,00x10,00'),
    5: ('RET-HST-005', 'RETENTOR', 'Retentor Haste de Válvula', '6,00x11,00x10,00'),
    6: ('RET-HST-006', 'RETENTOR', 'Retentor Haste de Válvula', '9,00x14,00x14,00'),
    10: ('RET-COM-001', 'RETENTOR', 'Retentor Eixo Comando', '30,00x52,00x7,00'),
    11: ('RET-COM-002', 'RETENTOR', 'Retentor Eixo Comando', '30,00x42,00x7,00'),
    12: ('RET-COM-003', 'RETENTOR', 'Retentor Eixo Comando', '55,00x70,00x8,00'),
    13: ('RET-COM-004', 'RETENTOR', 'Retentor Eixo Comando', '32,00x47,00x10,00'),
    14: ('RET-COM-005', 'RETENTOR', 'Retentor Eixo Comando', '35,00x48,00x7,00'),
    15: ('RET-COM-006', 'RETENTOR', 'Retentor Eixo Comando', '36,00x50,00x8,00'),
    20: ('RET-VIR-001', 'RETENTOR', 'Retentor Virabrequim Dianteiro', '40,00x52,00x7,00'),
    21: ('RET-VIR-002', 'RETENTOR', 'Retentor Virabrequim Dianteiro', '35,00x50,00x8,00'),
    22: ('RET-VIR-003', 'RETENTOR', 'Retentor Virabrequim Dianteiro', '70,00x90,00x10,00'),
    23: ('RET-VIR-004', 'RETENTOR', 'Retentor Virabrequim Diant/Tras', '30,00x44,00x8,00'),
    24: ('RET-VIR-005', 'RETENTOR', 'Retentor Virabrequim Traseiro', '82,00x105,00x12,00'),
    25: ('RET-VIR-006', 'RETENTOR', 'Retentor Virabrequim Traseiro', '90,00x110,00x9,00'),
    26: ('RET-VIR-007', 'RETENTOR', 'Retentor Virabrequim Traseiro', '110,00x130,00x13,00'),
    27: ('RET-VIR-008', 'RETENTOR', 'Retentor Virabrequim Traseiro', '85,00x105,00x12,00'),
    30: ('TMP-BLC-001', 'TAMPÃO', 'Tampão do Bloco STD', '23,00x28,00x7,00'),
    31: ('TMP-BLC-002', 'TAMPÃO', 'Tampão do Bloco SM', '23,00x29,00x7,00'),
    32: ('TMP-BLC-003', 'TAMPÃO', 'Tampão do Bloco C/Aba', '23,00x30,00x7,00')
}

print("Inserindo Componentes...")
for c_id, (cod, tipo, desc, med) in componentes_map.items():
    # Preços e Custos Estimados
    price = 20.00
    cost = 10.00
    low_desc = desc.lower()
    
    if 'haste de válvula' in low_desc:
        price, cost = 14.50, 8.20
    elif 'eixo comando' in low_desc:
        price, cost = 38.00, 22.00
    elif 'virabrequim dianteiro' in low_desc:
        price, cost = 52.00, 31.00
    elif 'virabrequim traseiro' in low_desc:
        price, cost = 95.00, 58.00
    elif 'virabrequim diant/tras' in low_desc:
        price, cost = 65.00, 38.00
    elif 'tampão' in low_desc:
        price, cost = 12.00, 4.50
    elif 'retentor' in low_desc:
        price, cost = 30.00, 15.00

    Componente.objects.update_or_create(
        codigo_interno=cod, 
        defaults={
            'tipo_componente': tipo,
            'descricao_generica': desc,
            'medidas_tecnicas': med,
            'unidade': 'UN',
            'custo_medio_ponderado': cost,
            'preco_venda': price,
            'ponto_pedido': 5,
            'estoque_atual': 10,
            'flag_jit': False,
            'ativo': True
        }
    )

# 4. REFERENCIAS
referencias_brasved = [
    (1, '5.081110', 'NBR/FPM'),
    (2, '5.070910', 'NBR/FPM'),
    (3, '5.071110', 'NBR'),
    (4, '5.081210', 'ACM'),
    (5, '5.061110', 'FPM'),
    (6, '5.091414', 'NBR'),
    (10, '5.305207', 'NBR'),
    (11, '5.304207', 'NBR'),
    (12, '5.557008', 'NBR'),
    (13, '5.324710', 'NBR/MVQ'),
    (14, '5.354807', 'NBR'),
    (15, '5.365008', 'MVQ'),
    (20, '5.405607', 'NBR/MVQ'),
    (21, '5.355008', 'NBR/MVQ'),
    (22, '5.709010', 'NBR/MVQ'),
    (23, '5.304408', 'MVQ'),
    (24, '5.8210512', 'MVQ'),
    (25, '5.9011009', 'MVQ'),
    (26, '5.11013013', 'MVQ'),
    (27, '5.8510512', 'MVQ'),
    (30, '4.232807', 'NBR'),
    (31, '4.232907', 'NBR'),
    (32, '4.233007', 'NBR')
]

print("Inserindo Referências...")
try:
    marca_brasved = Marca.objects.get(nome_marca='BRASVED')
except Marca.DoesNotExist:
    print("ERRO: Marca BRASVED não encontrada.")
    marca_brasved = None

if marca_brasved:
    for c_id, cod_fab, mat in referencias_brasved:
        cod_interno = componentes_map[c_id][0]
        try:
            comp = Componente.objects.get(codigo_interno=cod_interno)
            ReferenciaFabricante.objects.update_or_create(
                componente=comp, marca=marca_brasved, codigo_fabricante=cod_fab,
                defaults={'material_construcao': mat}
            )
        except Exception as e:
            print(f"Erro ao inserir referência {cod_fab}: {e}")

# 5. APLICACOES
aplicacoes = [
    (1, 11, 'Fiat 147/Uno/Palio'),
    (1, 13, 'Fiat Uno/Premio/Elba'),
    (1, 22, 'Ford Versailles/Royale'),
    (1, 62, 'Renault R19/Clio/Laguna'),
    (2, 14, 'Fiat Tempra/Tipo/Palio'),
    (2, 51, 'Peugeot 205/106/206/307'),
    (2, 72, 'VW Gol 1000/Parati 1000'),
    (3, 21, 'Ford Escort/Verona/Pampa'),
    (3, 32, 'GM Corsa/Monza/Kadett'),
    (4, 31, 'GM Monza OHC 1a gerac.'),
    (5, 41, 'Honda Civic/Accord/CR-V'),
    (6, 33, 'GM D10/D20 Perkins'),
    (10, 11, 'Fiat FIASA 1.050/1.0'),
    (10, 13, 'Fiat SEVEL 1.6/2.0'),
    (11, 14, 'Fiat Marea/Brava/Stilo'),
    (11, 61, 'Renault Twingo/Clio'),
    (12, 17, 'Ducato 2.8 TDS/Maxi'),
    (13, 22, 'Ford AP 2.0'),
    (13, 73, 'VW Ea111 1.0'),
    (14, 31, 'GM OHC 1.6/1.8'),
    (14, 32, 'GM Corsa/Vectra/Astra'),
    (15, 52, 'Peugeot Partner TU5JP'),
    (20, 13, 'Fiat SEVEL 1.6/2.0'),
    (20, 42, 'Honda Accord Wagon'),
    (21, 21, 'Ford CHT 1.4/1.6'),
    (21, 54, 'Peugeot XUD9 Diesel'),
    (21, 61, 'Renault C3L 1.6'),
    (22, 17, 'Ducato 2.8 Diesel'),
    (23, 15, 'Fiat Palio FIRE (Importado)'),
    (24, 21, 'Ford CHT / AP 1.8/2.0'),
    (25, 53, 'Peugeot XU10 8V/16V'),
    (26, 25, 'Caminhoes F12000/F14000'),
    (27, 52, 'Peugeot TU5JP'),
    (27, 72, 'VW AT 1.0 / AP 2.0'),
    (30, 71, 'VW Fusca/Kombi (STD)'),
    (31, 71, 'VW Fusca/Kombi (SM)'),
    (32, 71, 'VW Fusca/Kombi (C/ Aba)')
]

print("Inserindo Aplicações...")
for c_id, m_id, obs in aplicacoes:
    cod_interno = componentes_map[c_id][0]
    familia, cil, valv = motores_map[m_id]
    
    try:
        comp = Componente.objects.get(codigo_interno=cod_interno)
        motor = Motor.objects.get(codigo_familia=familia, cilindradas=cil, valvulas=valv)
        AplicacaoMotor.objects.update_or_create(
            componente=comp, motor=motor,
            defaults={'observacoes': obs}
        )
    except Exception as e:
        print(f"Erro em aplicacao {cod_interno} -> {familia}: {e}")

print("------------------------------------------")
print("TODOS OS DADOS FORAM PREENCHIDOS COM SUCESSO")
print("------------------------------------------")
