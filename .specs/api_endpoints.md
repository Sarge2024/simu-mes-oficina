# Especificação de Endpoints de API

O SIMU_MES Oficina divide suas APIs em dois backends (Django para dados transacionais e FastAPI para simulações financeiras).

---

## Prefixos e Rotas de Acesso (Proxy)

Todas as requisições partindo do frontend passam pelo proxy do Vite e são roteadas da seguinte forma:

* **Django APIs**: `/api/django/api/...` ➔ mapeia para `http://127.0.0.1:5002/api/...`
* **FastAPI APIs**: `/api/fastapi/...` ➔ mapeia para `http://127.0.0.1:5003/...`

---

## 1. Endpoints do Django (API REST + DRF)

Todos os endpoints retornam dados paginados (padrão de 50 registros por página, configurado em `REST_FRAMEWORK['PAGE_SIZE']`).

### Isolamento Multitenant

Endpoints que operam com dados tenanted (TenantModelViewSet) exigem o cabeçalho `X-Tenant-ID`. Sem este cabeçalho, retornam lista vazia (exceto para usuários MASTER que recebem visão global).

**Endpoints tenanted** (filtrados por `X-Tenant-ID`):
- `/api/core/clientes/`
- `/api/veiculos/ativos/`
- `/api/operacional/os/`
- `/api/operacional/orcamento/`
- `/api/operacional/orcamento-item/` (filtra via `orcamento__tenant`)
- `/api/operacional/alocacao/` (filtra via `os__tenant`)
- `/api/suprimentos/requisicao/`
- `/api/suprimentos/item-requisicao/` (filtra via `requisicao__tenant`)
- `/api/suprimentos/pedido-compra/`
- `/api/suprimentos/localizacao/`
- `/api/financeiro/titulo/`
- `/api/financeiro/transacao/`
- `/api/financeiro/conta-bancaria/`
- `/api/societario/movimento-socio/`

**Endpoints globais** (compartilhados entre tenants):
- `/api/veiculos/marcas/`, `modelos/`, `versoes/`, `motores/`, `categorias/`, `cotacoes/`
- `/api/catalogo/componentes/`, `referencias/`, `servicos/`, `aplicacoes/`, `aplicacoes_veiculos/`
- `/api/financeiro/plano-contas/`
- `/api/governanca/parametro/`
- `/api/core/empresas/`, `logs-auditoria/`

### Módulo: Veículos (`/api/django/api/veiculos/`)

#### `GET /api/django/api/veiculos/marcas/`
Retorna a listagem de marcas de veículos.
* **Filtros Query**:
  - `?nome_marca=<nome>` (Busca exata insensível a maiúsculas/minúsculas).
  - `?categoria=<id>` (Filtra marcas que possuem modelos sob a categoria informada).

#### `GET /api/django/api/veiculos/modelos/`
Retorna a listagem de modelos.
* **Filtros Query**:
  - `?marca=<id_marca>` (Filtra modelos pertencentes a uma marca específica).

#### `GET /api/django/api/veiculos/versoes/`
Retorna versões técnicas da FIPE.
* **Filtros Query**:
  - `?modelo=<id_modelo>`
  - `?codigo_fipe=<codigo>` (Ex: `005275-2`)

#### `GET /api/django/api/veiculos/ativos/`
Retorna os veículos físicos vinculados a clientes (específico por Tenant).
* **Filtros Query**:
  - `?placa=<placa>` (Busca por placa exata ou normalizada sem traço).
  - `?cliente=<id_cliente>`
* **Isolamento**: Retorna apenas veículos pertencentes à empresa informada no header `X-Tenant-ID`.

---

### Módulo: Core (`/api/django/api/core/`)

#### `GET /api/django/api/core/clientes/`
Retorna a listagem de Parceiros de Negócios (Clientes e Fornecedores) filtrados por Tenant.
* **Isolamento**: Retorna apenas clientes vinculados ao `X-Tenant-ID`.

#### `POST /api/django/api/core/auditlog/<id>/rollback/`
Realiza a reversão de uma alteração de dados gravada em log (apenas ADMIN).

---

### Módulo: Suprimentos (`/api/django/api/suprimentos/`)

#### `GET /api/django/api/suprimentos/localizacao/`
Retorna as localizações de estoque do tenant.
* **Filtros Query**:
  - `?componente=<id>` (Filtra por componente).
  - `?fileira=<nome>` (Filtra por fileira).
  - `?bloco=<nome>` (Filtra por bloco).
* **Isolamento**: Retorna apenas localizações vinculadas ao `X-Tenant-ID`.

#### `POST /api/django/api/suprimentos/localizacao/`
Cria uma nova localização. O campo `codigo` é auto-gerado no formato `FILEIRA-LADO-NÍVEL-BLOCO`.

* **Payload**:
```json
{
  "componente": 1,
  "fileira": "A",
  "lado": "E",
  "nivel": 2,
  "bloco": "B1",
  "capacidade": 50,
  "quantidade": 10
}
```

* **Resposta**: O objeto criado com `codigo` auto-gerado (ex: `"A-E-2-B1"`).

---

## 2. Endpoints do FastAPI (Simulação de Processos)

O microsserviço FastAPI calcula métricas financeiras complexas de governança.

### `POST /api/fastapi/calculate-pe/`
Calcula o Ponto de Equilíbrio Operacional (PEO), Econômico (PEE) e Financeiro (PEF).

* **Payload de Entrada (JSON)**:
```json
{
  "custo_fixo": 15000.0,
  "margem_contribuicao_pct": 35.0,
  "metas_sócios": 5000.0,
  "depreciacao": 1200.0
}
```

* **Resposta (JSON)**:
```json
{
  "PEO": 42857.14,
  "PEE": 57142.86,
  "PEF": 53714.29
}
```

---

### `POST /api/fastapi/simulate-scenario/`
Simula novos cenários financeiros a partir de CAPEX (investimentos em ativos) e novos custos fixos projetados.

* **Parâmetros Query**:
  - `?novo_capex=<valor>` (Simula depreciação anual estimada em 10%).
  - `?novo_custo_fixo=<valor>`

* **Payload de Entrada (JSON)**:
```json
{
  "custo_fixo": 15000.0,
  "margem_contribuicao_pct": 35.0,
  "metas_sócios": 5000.0,
  "depreciacao": 1200.0
}
```

* **Resposta (JSON)**: Retorna o cálculo simulado de PEO, PEE e PEF aplicando as alterações.
