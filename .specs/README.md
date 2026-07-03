# Especificações de Engenharia e Negócio — SIMU_MES Oficina

Esta pasta contém a especificação técnica e funcional do projeto **SIMU_MES Oficina**, servindo como referência contínua para novos desenvolvedores, versionamento de requisitos e decisões de design de arquitetura.

## Sumário da Documentação

Para compreender a fundo os detalhes do projeto, navegue pelas especificações abaixo:

1. 📘 **[Especificação de Arquitetura](file:///mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES%20Oficina/.specs/architecture.md)**
   - Detalha a stack tecnológica (React, Django, FastAPI, Postgres).
   - Explica o Proxy de APIs no Vite.
   - Descreve a arquitetura Multitenant (isolamento por Empresa/Filial) implementada.

2. 🗄️ **[Esquema do Banco de Dados](file:///mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES%20Oficina/.specs/database_schema.md)**
   - Lista todas as tabelas (modelos Django) e seus relacionamentos.
   - Demarca quais modelos são específicos de um Tenant (herdam de `TenantModel`) e quais são globais (Catálogos).

3. 🔐 **[Autenticação e RBAC (Role-Based Access Control)](file:///mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES%20Oficina/.specs/auth_and_rbac.md)**
   - Explica a lógica de autenticação (Mock Auth para desenvolvimento).
   - Apresenta as hierarquias de acesso (ADMIN > FINANCEIRO > SUPERVISOR > COLABORADOR) e o comportamento do controle de acessos.

4. 🌐 **[Endpoints de API](file:///mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES%20Oficina/.specs/api_endpoints.md)**
   - Documenta as APIs disponíveis expostas pelo Django e FastAPI.
   - Lista os principais parâmetros de busca e ordenação das rotas.

5. 📥 **[Processamento do Catálogo FIPE](file:///mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES%20Oficina/.specs/fipe_catalog_import.md)**
   - Explica o processo de ETL (Extração, Transformação e Carga) dos dados brutos de veículos da FIPE.
   - Mapeia as 4 fases sequenciais da importação.

---

## Estrutura Geral do Repositório

O projeto é estruturado em uma arquitetura monorepo simplificada:
```text
├── backend/
│   ├── django_app/       # API Principal do Sistema (Django 5.2 + DRF)
│   └── fastapi_app/      # Microsserviço de Processamento Paralelo / Leve (FastAPI)
├── frontend/             # Interface SPA (React 19 + TypeScript + Vite + Zustand)
├── Docs/                 # Arquivos brutos de dados (CSVs FIPE, PDFs)
└── .specs/               # Esta pasta de documentação de especificações continuas
```
