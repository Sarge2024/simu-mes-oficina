import { useState, useMemo } from 'react';
import DefaultLayout from '../../layouts/DefaultLayout';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { useUISettingsStore, ACCENT_MAP } from '../../store/useUISettingsStore';
import { useMasterStore, type MasterUser } from '../../store/useMasterStore';
import Card from '../../components/shared/Card';
import type { Role } from '../../store/useAuthStore';

ModuleRegistry.registerModules([AllCommunityModule]);

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'MASTER', label: 'Admin Master (Acesso Total)' },
  { value: 'ADMIN', label: 'Administrador (Gestão da Empresa)' },
  { value: 'FINANCEIRO', label: 'Financeiro (Gestor Financeiro)' },
  { value: 'SUPERVISOR', label: 'Supervisor (Chefe de Oficina)' },
  { value: 'COLABORADOR', label: 'Colaborador (Operacional)' },
];

const ROLE_HIERARCHY: Record<Role, number> = {
  MASTER: 5,
  ADMIN: 4,
  FINANCEIRO: 3,
  SUPERVISOR: 2,
  COLABORADOR: 1,
};

const ROLE_COLORS: Record<string, string> = {
  MASTER: '#6366f1',
  ADMIN: '#8b5cf6',
  FINANCEIRO: '#10b981',
  SUPERVISOR: '#f59e0b',
  COLABORADOR: '#64748b',
};

export default function UsuarioMasterPage() {
  const { accent } = useUISettingsStore();
  const accentColor = ACCENT_MAP[accent]?.primary || '#6366f1';
  const { usuarios, empresas, createUsuario, updateUsuario, deleteUsuario } = useMasterStore();
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<MasterUser> | null>(null);
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('todas');
  const [filtroRole, setFiltroRole] = useState<string>('todas');

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((u) => {
      if (filtroEmpresa !== 'todas' && u.empresa_id !== Number(filtroEmpresa)) return false;
      if (filtroRole !== 'todas' && u.role !== filtroRole) return false;
      return true;
    });
  }, [usuarios, filtroEmpresa, filtroRole]);

  const openNew = () => {
    setEditingUser({
      ativo: true,
      role: 'COLABORADOR',
      empresa_id: empresas[0]?.id ?? 1,
      username: '',
      senha: 'admin',
      nome: '',
      email: '',
      cargo: '',
    });
    setSenha('admin');
    setConfirmarSenha('admin');
    setIsDrawerOpen(true);
  };

  const openEdit = (user: MasterUser) => {
    setEditingUser({ ...user });
    setSenha(user.senha || '');
    setConfirmarSenha(user.senha || '');
    setIsDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // Validar senhas
    if (!isEditing && !senha) {
      alert('A senha é obrigatória para novos usuários.');
      return;
    }
    if (senha && senha !== confirmarSenha) {
      alert('As senhas não conferem.');
      return;
    }
    if (senha && senha.length < 4) {
      alert('A senha deve ter no mínimo 4 caracteres.');
      return;
    }

    // Se editando e senha vazia, manter a senha atual
    const userData = senha ? { ...editingUser, senha } : { ...editingUser };

    if (isEditing) {
      updateUsuario(editingUser.id!, userData);
    } else {
      const { id: _id, criado_em: _criado, ...rest } = userData as MasterUser;
      createUsuario(rest);
    }
    setIsDrawerOpen(false);
    setEditingUser(null);
    setSenha('');
    setConfirmarSenha('');
  };

  const handleDelete = (id: number) => {
    if (!confirm('Deseja realmente excluir este usuário?')) return;
    deleteUsuario(id);
  };

  const toggleAtivo = (user: MasterUser) => {
    updateUsuario(user.id, { ativo: !user.ativo });
  };

  const isEditing = editingUser?.id != null && usuarios.some((u) => u.id === editingUser!.id);

  const ActionButtons = (props: ICellRendererParams) => {
    const u = props.data as MasterUser;
    return (
      <div className="flex gap-2">
        <button
          onClick={() => openEdit(u)}
          className="px-2 py-1 bg-surface-700 text-surface-200 rounded text-xs hover:bg-surface-600 transition-colors"
        >
          Editar
        </button>
        <button
          onClick={() => toggleAtivo(u)}
          className="px-2 py-1 bg-surface-700 text-surface-200 rounded text-xs hover:bg-surface-600 transition-colors"
        >
          {u.ativo ? 'Desativar' : 'Ativar'}
        </button>
        <button
          onClick={() => handleDelete(u.id)}
          className="px-2 py-1 bg-danger-500/20 text-danger-400 rounded text-xs hover:bg-danger-500/40 transition-colors"
        >
          Excluir
        </button>
      </div>
    );
  };

  const RoleBadge = (props: ICellRendererParams) => {
    const role = props.value as Role;
    const color = ROLE_COLORS[role] || '#64748b';
    return (
      <span className="px-2 py-1 rounded text-xs font-medium" style={{ color, background: `${color}15` }}>
        {role}
      </span>
    );
  };

  const StatusBadge = (props: ICellRendererParams) => {
    return props.value
      ? <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-medium">Ativo</span>
      : <span className="px-2 py-1 rounded bg-danger-500/20 text-danger-400 text-xs font-medium">Inativo</span>;
  };

  const EmpresaCell = (props: ICellRendererParams) => {
    const empresaId = props.value as number | null;
    if (!empresaId) return <span className="text-surface-500 italic">Global (todas)</span>;
    const empresa = empresas.find((e) => e.id === empresaId);
    return <span className="text-surface-300">{empresa?.razao_social ?? `Empresa #${empresaId}`}</span>;
  };

  const columnDefs = useMemo<ColDef[]>(() => [
    { field: 'username', headerName: 'Usuário', width: 140 },
    { field: 'nome', headerName: 'Nome Completo', flex: 1 },
    { field: 'email', headerName: 'E-mail', flex: 1 },
    { field: 'cargo', headerName: 'Cargo', width: 160 },
    { field: 'role', headerName: 'Perfil', width: 160, cellRenderer: RoleBadge },
    { field: 'empresa_id', headerName: 'Empresa', flex: 1, cellRenderer: EmpresaCell },
    { field: 'ativo', headerName: 'Status', width: 100, cellRenderer: StatusBadge },
    { headerName: 'Ações', width: 200, cellRenderer: ActionButtons, sortable: false, filter: false },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const defaultColDef = useMemo(() => ({ sortable: true, filter: true, resizable: true }), []);

  return (
    <DefaultLayout>
      <div className="p-6 h-full flex flex-col">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-surface-50">👥 Gestão de Usuários</h1>
            <p className="text-sm text-surface-500 mt-1">Cadastro e controle de acesso por empresa</p>
          </div>
          <button
            onClick={openNew}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 shadow-lg"
            style={{ backgroundColor: accentColor, boxShadow: `0 10px 15px -3px ${accentColor}40` }}
          >
            + Novo Usuário
          </button>
        </header>

        {/* Filtros */}
        <div className="flex gap-3 mb-4">
          <select
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-200 text-sm focus:outline-none"
          >
            <option value="todas">Todas as Empresas</option>
            <option value="0">Global (sem empresa)</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.razao_social}</option>
            ))}
          </select>
          <select
            value={filtroRole}
            onChange={(e) => setFiltroRole(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-200 text-sm focus:outline-none"
          >
            <option value="todas">Todos os Perfis</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-2 text-xs text-surface-500">
            <span className="font-mono">{filteredUsuarios.length}</span> registro(s)
          </div>
        </div>

        <Card className="flex-1" padding="md">
          <div className="ag-theme-alpine-dark w-full h-full min-h-[400px]">
            <AgGridReact
              rowData={filteredUsuarios}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
            />
          </div>
        </Card>

        {/* Drawer de Cadastro/Edição */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
            <Card padding="md" className="w-[500px] h-full border-l shadow-2xl overflow-y-auto flex flex-col border-surface-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-surface-100">
                  {editingUser?.id !== undefined && usuarios.some((u) => u.id === editingUser.id)
                    ? 'Editar Usuário'
                    : 'Novo Usuário'}
                </h2>
                <button onClick={() => setIsDrawerOpen(false)} className="text-surface-400 hover:text-surface-200">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-surface-400 mb-1">Usuário (login) *</label>
                    <input
                      required
                      value={editingUser?.username || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-surface-400 mb-1">Nome Completo *</label>
                    <input
                      required
                      value={editingUser?.nome || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, nome: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-surface-400 mb-1">E-mail *</label>
                  <input
                    required
                    type="email"
                    value={editingUser?.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none"
                  />
                </div>

                {/* Senha */}
                <div className="p-3 rounded-lg bg-surface-800/50 border border-surface-700">
                  <p className="text-xs text-surface-500 mb-3 font-medium uppercase tracking-wider">
                    🔒 Credenciais de Acesso
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-surface-400 mb-1">
                        Senha {isEditing ? '' : '*'}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={senha}
                          onChange={(e) => setSenha(e.target.value)}
                          className="w-full px-3 py-2 pr-10 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2"
                          style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                          placeholder={isEditing ? 'Deixe vazio para manter' : 'Mín. 4 caracteres'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-surface-400 mb-1">
                        Confirmar Senha {isEditing ? '' : '*'}
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg bg-surface-800 border text-surface-100 focus:outline-none ${
                          confirmarSenha && senha !== confirmarSenha
                            ? 'border-danger-500 focus:border-danger-500'
                            : 'border-surface-700 focus:border-primary-500'
                        }`}
                        placeholder="Repita a senha"
                      />
                      {confirmarSenha && senha !== confirmarSenha && (
                        <p className="text-[10px] text-danger-400 mt-1">Senhas não conferem</p>
                      )}
                    </div>
                  </div>
                  {editingUser?.id !== undefined && usuarios.some((u) => u.id === editingUser.id) && (
                    <p className="text-[10px] text-surface-600 mt-2">
                      Preencha para alterar. Deixe vazio para manter a atual.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-surface-400 mb-1">Cargo</label>
                    <input
                      value={editingUser?.cargo || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, cargo: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-surface-400 mb-1">Perfil de Acesso *</label>
                    <select
                      value={editingUser?.role || 'COLABORADOR'}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as Role })}
                      className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-surface-400 mb-1">Empresa Vinculada</label>
                  <select
                    value={editingUser?.empresa_id ?? ''}
                    onChange={(e) => setEditingUser({ ...editingUser, empresa_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none"
                  >
                    <option value="">Nenhuma (Global)</option>
                    {empresas.map((e) => (
                      <option key={e.id} value={e.id}>{e.razao_social}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-surface-600 mt-1">Usuários globais (sem empresa) têm acesso a todas as empresas.</p>
                </div>

                {/* Role hierarchy info */}
                {editingUser?.role && (
                  <div className="p-3 rounded-lg bg-surface-800/50 border border-surface-700">
                    <p className="text-xs text-surface-500 mb-1">Hierarquia de Acesso</p>
                    <div className="flex items-center gap-1">
                      {ROLE_OPTIONS.map((r) => (
                        <div
                          key={r.value}
                          className={`flex-1 h-2 rounded-full transition-colors ${
                            ROLE_HIERARCHY[editingUser.role!] >= ROLE_HIERARCHY[r.value]
                              ? 'opacity-100'
                              : 'opacity-20'
                          }`}
                          style={{ backgroundColor: ROLE_COLORS[r.value] }}
                          title={r.label}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-surface-600 mt-1">
                      Nível {ROLE_HIERARCHY[editingUser.role!]}/5 —{' '}
                      {ROLE_HIERARCHY[editingUser.role!] >= 5 ? 'Acesso total ao sistema' :
                       ROLE_HIERARCHY[editingUser.role!] >= 4 ? 'Gestão completa da empresa' :
                       ROLE_HIERARCHY[editingUser.role!] >= 3 ? 'Acesso financeiro e operacional' :
                       ROLE_HIERARCHY[editingUser.role!] >= 2 ? 'Supervisão da oficina' :
                       'Acesso operacional básico'}
                    </p>
                  </div>
                )}

                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={editingUser?.ativo ?? true}
                    onChange={(e) => setEditingUser({ ...editingUser, ativo: e.target.checked })}
                    className="mr-2 rounded border-surface-700 text-primary-600 focus:ring-primary-500 bg-surface-800"
                  />
                  <label htmlFor="ativo" className="text-sm text-surface-200">Usuário Ativo</label>
                </div>

                <div className="mt-auto pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-surface-600 text-surface-200 hover:bg-surface-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                    style={{ backgroundColor: accentColor }}
                  >
                    Salvar Usuário
                  </button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
