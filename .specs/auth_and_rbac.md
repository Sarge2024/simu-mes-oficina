# Autenticação e RBAC (Role-Based Access Control)

Para acelerar o desenvolvimento local e a prototipação rápida, o sistema **SIMU_MES Oficina** utiliza uma lógica simplificada de **Mock Auth** no frontend e controle hierárquico de permissões (RBAC).

---

## Estrutura do Mock Auth

A autenticação é gerenciada no frontend através do estado global persistido do Zustand em `frontend/src/store/useAuthStore.ts`.
A senha para qualquer um dos usuários fictícios descritos abaixo é **sempre** `admin`.

### Usuários de Teste Disponíveis

| Usuário | Role (Cargo no Sistema) | Nome Real Mock | Email de Teste | Rota Padrão Pós-Login |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | **ADMIN** (Diretor) | Administrador | `admin@simumes.com.br` | `/home` |
| `financeiro` | **FINANCEIRO** (Gestor Financeiro) | Ana Controller | `financeiro@simumes.com.br` | `/home` |
| `supervisor` | **SUPERVISOR** (Chefe de Oficina) | Carlos Gerente | `supervisor@simumes.com.br` | `/home` |
| `colaborador` | **COLABORADOR** (Mecânico) | João Mecânico | `colaborador@simumes.com.br` | `/home` |

---

## Hierarquia de Permissões (RBAC)

O controle de acessos não é baseado em uma correspondência exata de papéis, mas sim em uma **estrutura de peso hierárquico**. A função `hasAccess` avalia se o nível hierárquico do usuário logado é maior ou igual ao nível requerido para acessar um recurso/tela.

### Tabela de Pesos Hierárquicos

```text
ADMIN (Peso 4)
  └── FINANCEIRO (Peso 3)
        └── SUPERVISOR (Peso 2)
              └── COLABORADOR (Peso 1)
```

### Exemplo de Lógica (`hasAccess`):
Se um botão exige permissão `SUPERVISOR`, um usuário com perfil `FINANCEIRO` ou `ADMIN` também poderá visualizá-lo e interagir com ele, uma vez que seus pesos são superiores ou equivalentes.

A verificação no frontend é feita através do método:
```typescript
export function hasAccess(userRole: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.some((r) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[r]);
}
```

---

## Integração da Autenticação com o Multitenancy

Ao realizar o login, a store de autenticação armazena os dados do usuário, o token simulado e o `tenantId` (inicializado como `1` para o ambiente de desenvolvimento).

O cabeçalho `X-Tenant-ID` é anexado automaticamente a cada requisição de API pelo interceptor do Axios:
1. O usuário é autenticado localmente.
2. A store define a propriedade `tenantId: 1`.
3. O interceptor do Axios lê a store: `useAuthStore.getState().tenantId`.
4. O cabeçalho é montado e enviado na requisição HTTP: `X-Tenant-ID: 1`.
5. O backend Django lê o cabeçalho no `CurrentTenantMiddleware` e limita o escopo da transação do banco ao tenant `1`.
