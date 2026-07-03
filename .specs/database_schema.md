# Esquema de Banco de Dados

Esta especificação descreve as tabelas físicas do banco de dados relacional PostgreSQL estruturadas pelos aplicativos do Django. Os modelos estão categorizados entre **Tenanted** (isolados por inquilino, herdando de `TenantModel`) e **Globais** (dados compartilhados por toda a plataforma, como os catálogos de veículos).

---

## Legenda dos Campos
* 🔑 `PK`: Chave Primária
* 🔗 `FK`: Chave Estrangeira
* 🚀 `Tenant`: Campo herdado de `TenantModel` (`tenant_id`)

---

## 1. Módulo Core (Cadastro Base e Auditoria)

### `core_empresa_filial` (EmpresaFilial)
Representa as empresas parceiras ou filiais cadastradas no sistema. Serve como o modelo representativo do **Tenant**.
* `id` 🔑: Auto Increment
* `razao_social`: Char(255)
* `cnpj`: Char(18) (Único)
* `inscricao_estadual`: Char(20)
* `endereco`: Text
* `telefone`: Char(20)
* `email`: Email
* `configuracoes`: JSON (Configurações da filial)
* `tipo_empresa`: Char(20) (Choices: cliente, fornecedor, ambos, matriz_filial)
* `ativo`: Boolean
* `criado_em`/`atualizado_em`: DateTime

### `core_cliente` (Cliente)
Parceiros de negócios cadastrados.
* `id` 🔑: Auto Increment
* `tenant_id` 🔗 🚀: EmpresaFilial (on_delete=CASCADE)
* `tipo_pessoa`: Char(2) (Choices: pf, pj)
* `is_cliente` / `is_fornecedor`: Boolean
* `nome_razao`: Char(255)
* `apelido_fantasia`: Char(255)
* `cpf_cnpj`: Char(18) (Único por Tenant — UniqueConstraint com `tenant_id`)
* `telefone` / `email` / `cep` / `endereco` / `bairro` / `cidade` / `estado`: Campos de texto e endereço
* `limite_credito`: Decimal(12, 2)
* `categoria_contrato`: Char(20) (Choices: avulso, frota, seguradora)
* `prazo_faturamento`: Integer
* `lead_time`: Integer
* `ativo`: Boolean

### `core_colaborador` (Colaborador)
Profissionais da oficina (mecânicos, eletricistas, etc.).
* `id` 🔑: Auto Increment
* `tenant_id` 🔗 🚀: EmpresaFilial (on_delete=CASCADE)
* `nome`: Char(255)
* `cargo`: Char(100)
* `custo_hora`: Decimal(10, 2)
* `especialidade`: Char(100) (Ex: Motor, Elétrica)
* `ativo`: Boolean

### `core_audit_log` (AuditLog)
Tabela de logs para auditoria de alterações críticas.
* `id` 🔑: Auto Increment
* `usuario`: Char(100)
* `tabela`: Char(100)
* `registro_id`: Char(255)
* `acao`: Char(50) (Choices: Criado, Editado, Excluído, Rollback)
* `detalhes`: JSON (Snapshot de dados pré-alteração)
* `detalhamento`: Text
* `timestamp`: DateTime

---

## 2. Módulo de Veículos (Global e Instâncias)

Os dados FIPE de Marcas, Modelos, Motores e Versões são **Globais** (sem `tenant_id`). Apenas a instância física (`Ativo`) é vinculada a um tenant.

### `veic_motor` (Motor) — *Global*
* `id` 🔑: Auto Increment
* `codigo_familia`: Char(50) (Ex: AP, FIRE)
* `cilindradas`: Char(20) (Ex: 1.0, 2.0)
* `valvulas`: Char(10) (Ex: 8V, 16V)
* `ativo`: Boolean

### `veic_marca` (Marca) — *Global*
* `id` 🔑: Auto Increment
* `nome_marca`: Char(100) (Único)
* `ativo`: Boolean

### `veic_categoria` (Categoria) — *Global*
* `id` 🔑: Auto Increment
* `nome`: Char(50) (Único) (Ex: Carro, Moto)

### `veic_modelo` (Modelo) — *Global*
* `id` 🔑: Auto Increment
* `nome_modelo`: Char(150)
* `marca_id` 🔗: Marca (on_delete=PROTECT)
* `categoria_id` 🔗: Categoria (on_delete=PROTECT)
* `ativo`: Boolean

### `veic_versao` (Versao) — *Global*
* `id` 🔑: Auto Increment
* `modelo_id` 🔗: Modelo (on_delete=CASCADE)
* `nome_versao`: Char(150)
* `codigo_fipe`: Char(20) (Único)
* `motor_id` 🔗: Motor (on_delete=SET_NULL)
* `motorizacao`: Char(50)
* `combustivel`: Char(1) (Choices: G, A, F, D, E, H)

### `veic_cotacao_mercado` (CotacaoMercado) — *Global*
Histórico de valores FIPE.
* `id` 🔑: Auto Increment
* `versao_id` 🔗: Versao (on_delete=CASCADE)
* `ano_referencia`: SmallInteger
* `mes_referencia`: SmallInteger
* `valor`: Decimal(12, 2)

### `veic_ativo` (Ativo)
Veículo de cliente registrado na oficina.
* `id` 🔑: Auto Increment
* `tenant_id` 🔗 🚀: EmpresaFilial (on_delete=CASCADE)
* `placa`: Char(10) (Único)
* `chassi`: Char(17) (Único)
* `cliente_id` 🔗: Cliente (on_delete=PROTECT)
* `versao_id` 🔗: Versao (on_delete=PROTECT)
* `ano_fabricacao`: SmallInteger
* `cor`: Char(50)
* `km`: Integer
* `ativo`: Boolean

---

## 3. Módulo de Catálogo (Global)

Cadastro mestre de peças genéricas e equivalências de mercado.

### `prod_componente` (Componente) — *Global*
* `id` 🔑: Auto Increment
* `codigo_interno`: Char(50) (Gerado no `save()` ex: JUN-001-10X200)
* `tipo_componente`: Char(50) (Choices: RETENTOR, JUNTA, FILTRO, CORREIA, OLEO, OUTRO)
* `descricao_generica`: Char(255)
* `medidas_tecnicas`: Char(100)
* `unidade`: Char(10)
* `custo_medio_ponderado`: Decimal(12, 2)
* `preco_venda`: Decimal(12, 2)
* `ponto_pedido`: Integer
* `estoque_atual`: Integer
* `flag_jit`: Boolean
* `ativo`: Boolean

### `prod_referencia_fabricante` (ReferenciaFabricante) — *Global*
Equivalências de fabricantes específicos para componentes genéricos.
* `id` 🔑: Auto Increment
* `componente_id` 🔗: Componente (on_delete=CASCADE)
* `marca_id` 🔗: Marca (on_delete=PROTECT)
* `codigo_fabricante`: Char(100)
* `material_construcao`: Char(100)

### `serv_catalogo` (ServicoCatalogo) — *Global*
Serviços e mão de obra oferecidos.
* `id` 🔑: Auto Increment
* `codigo`: Char(50) (Único)
* `descricao`: Char(255)
* `tempo_padrao`: Decimal(6, 2)
* `preco_base`: Decimal(12, 2)
* `especialidade`: Char(100)
* `ativo`: Boolean

---

## 4. Módulo Operacional (Gestão da Oficina)

### `ope_ordem_servico` (OrdemServico)
* `id` 🔑: Auto Increment
* `tenant_id` 🔗 🚀: EmpresaFilial (on_delete=CASCADE)
* `veiculo_id` 🔗: Ativo (on_delete=PROTECT)
* `cliente_id` 🔗: Cliente (on_delete=PROTECT)
* `status`: Char(20) (Choices: aberta, orcamento, aprovada, execucao, finalizada, cancelada)
* `sintomas_cliente`: Text
* `diagnostico_tecnico`: Text
* `quilometragem_entrada`: Integer
* `data_abertura`/`data_conclusao`: DateTime

### `ope_orcamento` (Orcamento)
* `id` 🔑: Auto Increment
* `tenant_id` 🔗 🚀: EmpresaFilial (on_delete=CASCADE)
* `os_id` 🔗: OrdemServico (on_delete=CASCADE)
* `versao`: Char(10) (Ex: 1.0, 1.1)
* `valor_total`: Decimal(12, 2)
* `status`: Char(20) (Choices: rascunho, enviado, aprovado, rejeitado)

---

## 5. Módulo Financeiro

### `fin_plano_contas` (PlanoContas) — *Global*
* `id` 🔑: Auto Increment
* `codigo`: Char(20) (Único, ex: 2.1.1.1.0)
* `descricao`: Char(255)
* `tipo_natureza`: Char(20) (Choices: receita, despesa, ativo, passivo)
* `nivel`: SmallInteger
* `ativo`: Boolean

### `fin_conta_bancaria` (ContaBancaria) — *Tenant*
* `id` 🔑: Auto Increment
* `tenant_id` 🔗 🚀: EmpresaFilial (on_delete=CASCADE)
* `nome`: Char(100)
* `tipo`: Char(50) (Corrente, Poupança, Caixa, Cartão)
* `taxa_administrativa_pct`: Decimal(5, 2)
* `prazo_recebimento_dias`: Integer
* `saldo_atual`: Decimal(14, 2)
* `ativo`: Boolean

### `fin_titulo` (Titulo) — *Tenant*
Títulos gerados a partir de Ordens de Serviço.
* `id` 🔑: Auto Increment
* `tenant_id` 🔗 🚀: EmpresaFilial (on_delete=CASCADE)
* `os_id` 🔗: OrdemServico (on_delete=PROTECT)
* `cliente_id` 🔗: Cliente (on_delete=PROTECT)
* `valor_original` / `valor_atualizado`: Decimal(14, 2)
* `vencimento`: Date
* `data_competencia`: Date
* `status`: Char(20) (Choices: aberto, parcial, pago, renegociado, cancelado)

### `fin_transacao` (Transacao) — *Tenant*
Lançamentos de pagamentos.
* `id` 🔑: Auto Increment
* `tenant_id` 🔗 🚀: EmpresaFilial (on_delete=CASCADE)
* `titulo_id` 🔗: Titulo (on_delete=CASCADE)
* `plano_contas_id` 🔗: PlanoContas (on_delete=PROTECT)
* `conta_bancaria_id` 🔗: ContaBancaria (on_delete=PROTECT)
* `valor_pago`: Decimal(14, 2)
* `juros` / `multa` / `delta_variacao_os`: Decimal
* `data_caixa`: Date

---

## 6. Módulo de Suprimentos

### `sup_requisicao` (Requisicao) — *Tenant*
* `id` 🔑: Auto Increment
* `tenant_id` 🔗 🚀: EmpresaFilial (on_delete=CASCADE)
* `os_id` 🔗: OrdemServico (on_delete=CASCADE)
* `tipo`: Char(20) (Choices: preliminar, confirmada, complementar)
* `status`: Char(20) (Choices: aberta, em_cotacao, aprovada, parcial, atendida, cancelada)

### `sup_item_requisicao` (ItemRequisicao)
* `id` 🔑: Auto Increment
* `requisicao_id` 🔗: Requisicao (on_delete=CASCADE)
* `produto_id` 🔗: Componente (on_delete=PROTECT)
* `quantidade`: Decimal(10, 2)
* `status_compra`: Char(20) (Choices: pendente, cotado, comprado, recebido, cancelado)
* `fornecedor_id` 🔗: Cliente (on_delete=SET_NULL)
* `pedido_compra_id` 🔗: PedidoCompra (on_delete=SET_NULL)

### `sup_entrada_nfe` (EntradaNFe) — *Tenant*
Notas fiscais de entrada de produtos.
* `id` 🔑: Auto Increment
* `tenant_id` 🔗 🚀: EmpresaFilial (on_delete=CASCADE)
* `chave_acesso_nfe`: Char(44) (Único)
* `fornecedor_id` 🔗: Cliente (on_delete=PROTECT)
* `data_emissao`: Date

### `sup_localizacao_estoque` (LocalizacaoEstoque) — *Tenant*
Posição física de armazenamento de componentes no depósito.
* `id` 🔑: Auto Increment
* `tenant_id` 🔗 🚀: EmpresaFilial (on_delete=CASCADE)
* `componente_id` 🔗: Componente (on_delete=CASCADE)
* `fileira`: Char(20) — Corredor/rua do depósito (Ex: A, B, AA)
* `lado`: Char(1) — Choices: E (Esquerda), D (Direita)
* `nivel`: SmallInteger — Andar da prateleira (1 = inferior)
* `bloco`: Char(10) — Zona/seção (Ex: B1, B2)
* `codigo`: Char(50) — Auto-gerado: FILEIRA-LADO-NÍVEL-BLOCO (Ex: A-E-2-B1)
* `capacidade`: Integer — Capacidade máxima da posição (0 = sem limite)
* `quantidade`: Integer — Quantidade atual nesta posição
* `ativo`: Boolean
* **Unique Constraint**: `(tenant, codigo)`
