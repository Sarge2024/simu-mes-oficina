-- ==============================================================================
-- 1. CADASTRO DE MARCAS (Montadoras e Fabricantes de Peças)
-- ==============================================================================
INSERT INTO veic_marca (id, nome_marca, ativo, criado_em) VALUES 
(1, 'FIAT', true, current_timestamp),
(2, 'FORD', true, current_timestamp),
(3, 'GM - CHEVROLET', true, current_timestamp),
(4, 'HONDA', true, current_timestamp),
(5, 'VOLKSWAGEN', true, current_timestamp),
(99, 'BRASVED', true, current_timestamp)
ON CONFLICT (nome_marca) DO NOTHING;

-- ==============================================================================
-- 2. CADASTRO DE MOTORES (A base da Aplicação Automotiva)
-- ==============================================================================
INSERT INTO veic_motor (id, codigo_familia, cilindradas, valvulas, ativo, criado_em) VALUES 
(1, 'FIASA', '1.050', '8V', true, current_timestamp),
(2, 'SEVEL', '1.6', '8V', true, current_timestamp),
(3, 'FIRE', '1.0', '8V', true, current_timestamp),
(4, 'CHT', '1.4', '8V', true, current_timestamp),
(5, 'AP', '1.8', '8V', true, current_timestamp),
(6, 'OHC', '1.6', '8V', true, current_timestamp)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 3. CADASTRO DE COMPONENTES GENÉRICOS (O Código Interno da Oficina)
-- ==============================================================================
-- Os custos médios iniciam zerados, pois serão atualizados pela NFe.
INSERT INTO prod_componente (id, codigo_interno, tipo_componente, descricao_generica, medidas_tecnicas, custo_medio_ponderado, unidade, preco_venda, ponto_pedido, estoque_atual, flag_jit, ativo, criado_em, atualizado_em) VALUES 
(1, 'RET-VAL-001', 'RETENTOR', 'Retentor Haste de válvula', '8,00x10,90x10,00', 0.00, 'UN', 0.00, 0, 0, false, true, current_timestamp, current_timestamp),
(2, 'RET-COM-001', 'RETENTOR', 'Retentor Eixo Comando', '30,00x52,00x7,00', 0.00, 'UN', 0.00, 0, 0, false, true, current_timestamp, current_timestamp),
(3, 'RET-VBD-001', 'RETENTOR', 'Retentor Virabrequim Dianteiro', '40,00x52,00x7,00', 0.00, 'UN', 0.00, 0, 0, false, true, current_timestamp, current_timestamp),
(4, 'RET-VBD-002', 'RETENTOR', 'Retentor Virabrequim Dianteiro', '35,00x50,00x8,00', 0.00, 'UN', 0.00, 0, 0, false, true, current_timestamp, current_timestamp),
(5, 'RET-VBT-001', 'RETENTOR', 'Retentor Virabrequim Traseiro', '82,00x105,00x12,00', 0.00, 'UN', 0.00, 0, 0, false, true, current_timestamp, current_timestamp)
ON CONFLICT (codigo_interno) DO NOTHING;

-- ==============================================================================
-- 4. REFERÊNCIA DO FABRICANTE (As Equivalências)
-- Amarrando o Código Interno ao Código do Catálogo da BRASVED
-- ==============================================================================
INSERT INTO prod_referencia_fabricante (componente_id, marca_id, codigo_fabricante, material_construcao, criado_em) VALUES 
(1, 99, '5.081110', 'NBR', current_timestamp),
(2, 99, '5.305207', 'NBR', current_timestamp),
(3, 99, '5.405607', 'NBR', current_timestamp),
(4, 99, '5.355008', 'NBR', current_timestamp),
(5, 99, '5.8210512', 'MVQ', current_timestamp)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 5. APLICAÇÃO TÉCNICA (Cruzamento Peça x Motor)
-- ==============================================================================
INSERT INTO prod_aplicacao_motor (componente_id, motor_id, observacoes, criado_em) VALUES 
(1, 1, 'Aplicação FIASA 1.050/1.0', current_timestamp),
(1, 2, 'Aplicação SEVEL 1.6/2.0', current_timestamp),
(1, 5, 'Aplicação AP 1.8', current_timestamp),
(2, 1, 'Aplicação FIASA 1.050/1.0', current_timestamp),
(2, 2, 'Aplicação SEVEL 1.6/2.0', current_timestamp),
(3, 2, 'Aplicação SEVEL 1.6/2.0', current_timestamp),
(4, 4, 'Aplicação Ford CHT 1.4/1.6', current_timestamp),
(4, 6, 'Aplicação GM OHC 1.6/1.8', current_timestamp),
(5, 4, 'Aplicação Ford CHT 1.4/1.6', current_timestamp)
ON CONFLICT DO NOTHING;

