import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, getDefaultRoute } from './store/useAuthStore';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import HomePage from './pages/HomePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import MasterDashboardPage from './pages/admin/MasterDashboardPage';
import EmpresaMasterPage from './pages/admin/EmpresaMasterPage';
import UsuarioMasterPage from './pages/admin/UsuarioMasterPage';
import ParametroMasterPage from './pages/admin/ParametroMasterPage';
import VeiculoMasterPage from './pages/admin/VeiculoMasterPage';
import ClienteMasterPage from './pages/admin/ClienteMasterPage';
import ComponenteMasterPage from './pages/admin/ComponenteMasterPage';
import ReferenciaFabricantePage from './pages/admin/ReferenciaFabricantePage';
import ServicoMasterPage from './pages/admin/ServicoMasterPage';
import LocalizacaoEstoquePage from './pages/admin/LocalizacaoEstoquePage';
import RevisionControlPage from './pages/admin/RevisionControlPage';
import FinanceiroDashboardPage from './pages/financeiro/FinanceiroDashboardPage';
import PlanoContasPage from './pages/financeiro/PlanoContasPage';
import SupervisorDashboardPage from './pages/supervisor/SupervisorDashboardPage';
import OficinaPage from './pages/oficina/OficinaPage';
import FechamentoOSPage from './pages/oficina/FechamentoOSPage';
import ProcessSimulatorPage from './pages/process_simulator/ProcessSimulatorPage';
import AgentModelerPage from './pages/agent_modeler/AgentModelerPage';
import SettingsPage from './pages/settings/SettingsPage';
import ExpedientePage from './pages/settings/ExpedientePage';
import ConfiguracaoOficinaPage from './pages/settings/ConfiguracaoOficinaPage';
import MarcaSelectorPage from './pages/settings/MarcaSelectorPage';
import VeiculoCatalogoPage from './pages/admin/VeiculoCatalogoPage';

function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-4">🚫</p>
        <h1 className="text-2xl font-bold text-surface-100 mb-2">Acesso Negado</h1>
        <p className="text-surface-500 text-sm mb-6">Você não tem permissão para acessar esta página.</p>
        <a href="/" className="px-6 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-500 transition-colors">
          Voltar ao início
        </a>
      </div>
    </div>
  );
}

function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDefaultRoute(user.role)} replace />;
}

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={isAuthenticated ? <RootRedirect /> : <LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* Home / Launchpad */}
        <Route path="/home" element={<ProtectedRoute allowedRoles={['COLABORADOR']}><HomePage /></ProtectedRoute>} />

        {/* Admin Master Routes */}
        <Route element={<ProtectedRoute allowedRoles={['MASTER']} />}>
          <Route path="/admin/master" element={<MasterDashboardPage />} />
          <Route path="/admin/empresas" element={<EmpresaMasterPage />} />
          <Route path="/admin/usuarios" element={<UsuarioMasterPage />} />
          <Route path="/admin/parametros" element={<ParametroMasterPage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/veiculos" element={<VeiculoMasterPage />} />
          <Route path="/admin/clientes" element={<ClienteMasterPage />} />
          <Route path="/admin/componentes" element={<ComponenteMasterPage />} />
          <Route path="/admin/componentes/:id/referencias" element={<ReferenciaFabricantePage />} />
          <Route path="/admin/servicos" element={<ServicoMasterPage />} />
          <Route path="/admin/localizacao-estoque" element={<LocalizacaoEstoquePage />} />
          <Route path="/admin/revisoes" element={<RevisionControlPage />} />
          <Route path="/admin/catalogo" element={<VeiculoCatalogoPage />} />
        </Route>

        {/* Financeiro */}
        <Route element={<ProtectedRoute allowedRoles={['FINANCEIRO', 'ADMIN']} />}>
          <Route path="/financeiro" element={<FinanceiroDashboardPage />} />
          <Route path="/financeiro/plano-contas" element={<PlanoContasPage />} />
        </Route>

        {/* Supervisor */}
        <Route path="/supervisor" element={<ProtectedRoute allowedRoles={['SUPERVISOR']}><SupervisorDashboardPage /></ProtectedRoute>} />

        {/* Colaborador (all roles) */}
        <Route element={<ProtectedRoute allowedRoles={['COLABORADOR']} />}>
          <Route path="/oficina" element={<OficinaPage />} />
          <Route path="/oficina/fechamento/:id" element={<FechamentoOSPage />} />
        </Route>

        {/* Tools (Admin only) */}
        <Route path="/process-simulator" element={<ProtectedRoute allowedRoles={['ADMIN']}><ProcessSimulatorPage /></ProtectedRoute>} />
        <Route path="/agent-modeler" element={<ProtectedRoute allowedRoles={['ADMIN']}><AgentModelerPage /></ProtectedRoute>} />

        {/* Settings */}
        <Route element={<ProtectedRoute allowedRoles={['COLABORADOR']} />}>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/marcas" element={<MarcaSelectorPage />} />
        </Route>
        
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/settings/expediente" element={<ExpedientePage />} />
          <Route path="/settings/oficina" element={<ConfiguracaoOficinaPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
