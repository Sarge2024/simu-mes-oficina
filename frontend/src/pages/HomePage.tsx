import DefaultLayout from '../layouts/DefaultLayout';
import { useAuthStore } from '../store/useAuthStore';
import Card from '../components/shared/Card';
import PageHeader from '../components/shared/PageHeader';

export default function HomePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <DefaultLayout>
      <div className="flex flex-col h-full max-w-7xl mx-auto w-full">
        <PageHeader 
          title={`Bem-vindo(a), ${user?.nome?.split(' ')[0] ?? 'Usuário'}!`}
          subtitle="Escolha uma das etapas abaixo para iniciar o fluxo operacional"
          showBackButton={false}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
          {/* Cadastro */}
          <Card padding="lg" className="flex flex-col border-t-4 border-t-primary-500 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/10">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 flex items-center justify-center text-primary-400 text-2xl shadow-inner border border-primary-500/20">📋</div>
              <h3 className="font-bold text-surface-100 text-xl tracking-tight">Cadastro</h3>
            </div>
            <p className="text-sm text-surface-500 mb-6 flex-1">Gestão de entidades, frotas e ativos base da sua oficina.</p>
            <div className="space-y-2.5">
              <a href="/admin/clientes" className="group flex items-center justify-between text-sm font-medium text-surface-300 hover:text-primary-400 transition-colors p-3 -mx-3 rounded-xl hover:bg-primary-500/10 border border-transparent hover:border-primary-500/20">
                <span>Clientes</span>
                <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span>
              </a>
              <a href="/admin/veiculos" className="group flex items-center justify-between text-sm font-medium text-surface-300 hover:text-primary-400 transition-colors p-3 -mx-3 rounded-xl hover:bg-primary-500/10 border border-transparent hover:border-primary-500/20">
                <span>Veículos e Frotas</span>
                <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span>
              </a>
              <a href="/admin/catalogo" className="group flex items-center justify-between text-sm font-medium text-surface-300 hover:text-primary-400 transition-colors p-3 -mx-3 rounded-xl hover:bg-primary-500/10 border border-transparent hover:border-primary-500/20">
                <span>Catálogo FIPE</span>
                <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span>
              </a>
            </div>
          </Card>

          {/* Inspeção */}
          <Card padding="lg" className="flex flex-col border-t-4 border-t-warning-500 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/10">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning-500/20 to-warning-600/10 flex items-center justify-center text-warning-400 text-2xl shadow-inner border border-warning-500/20">🔍</div>
              <h3 className="font-bold text-surface-100 text-xl tracking-tight">Inspeção</h3>
            </div>
            <p className="text-sm text-surface-500 mb-6 flex-1">Triagem, diagnóstico rápido e recepção do veículo na oficina.</p>
            <div className="space-y-2.5">
              <a href="/oficina" className="group flex items-center justify-between text-sm font-medium text-surface-300 hover:text-warning-400 transition-colors p-3 -mx-3 rounded-xl hover:bg-warning-500/10 border border-transparent hover:border-warning-500/20">
                <span>Painel da Oficina (Boxes)</span>
                <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span>
              </a>
              <a href="#" className="group flex items-center justify-between text-sm font-medium text-surface-500 cursor-not-allowed p-3 -mx-3 rounded-xl bg-surface-900/50 border border-surface-800" title="Em breve">
                <span>Checklist de Entrada</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-surface-600 bg-surface-800 px-2 py-0.5 rounded">Em Breve</span>
              </a>
            </div>
          </Card>

          {/* Orçamento */}
          <Card padding="lg" className="flex flex-col border-t-4 border-t-accent-500 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/10">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500/20 to-accent-600/10 flex items-center justify-center text-accent-400 text-2xl shadow-inner border border-accent-500/20">💰</div>
              <h3 className="font-bold text-surface-100 text-xl tracking-tight">Orçamento</h3>
            </div>
            <p className="text-sm text-surface-500 mb-6 flex-1">Precificação de peças e tempo de mão de obra (TMO).</p>
            <div className="space-y-2.5">
              <a href="/admin/componentes" className="group flex items-center justify-between text-sm font-medium text-surface-300 hover:text-accent-400 transition-colors p-3 -mx-3 rounded-xl hover:bg-accent-500/10 border border-transparent hover:border-accent-500/20">
                <span>Peças e Insumos</span>
                <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span>
              </a>
              <a href="/admin/servicos" className="group flex items-center justify-between text-sm font-medium text-surface-300 hover:text-accent-400 transition-colors p-3 -mx-3 rounded-xl hover:bg-accent-500/10 border border-transparent hover:border-accent-500/20">
                <span>Serviços (TMO)</span>
                <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span>
              </a>
              <a href="/admin/revisoes" className="group flex items-center justify-between text-sm font-medium text-surface-300 hover:text-accent-400 transition-colors p-3 -mx-3 rounded-xl hover:bg-accent-500/10 border border-transparent hover:border-accent-500/20">
                <span>Planos de Revisão</span>
                <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span>
              </a>
            </div>
          </Card>

          {/* Programação */}
          <Card padding="lg" className="flex flex-col border-t-4 border-t-emerald-500 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/10">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center text-emerald-500 text-2xl shadow-inner border border-emerald-500/20">📅</div>
              <h3 className="font-bold text-surface-100 text-xl tracking-tight">Programação</h3>
            </div>
            <p className="text-sm text-surface-500 mb-6 flex-1">Agendamento, infraestrutura e painel de supervisão.</p>
            <div className="space-y-2.5">
              <a href="/settings/oficina" className="group flex items-center justify-between text-sm font-medium text-surface-300 hover:text-emerald-400 transition-colors p-3 -mx-3 rounded-xl hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20">
                <span>Configuração da Oficina</span>
                <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span>
              </a>
              <a href="/settings/expediente" className="group flex items-center justify-between text-sm font-medium text-surface-300 hover:text-emerald-400 transition-colors p-3 -mx-3 rounded-xl hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20">
                <span>Quadro de Expediente</span>
                <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span>
              </a>
              <a href="/supervisor" className="group flex items-center justify-between text-sm font-medium text-surface-300 hover:text-emerald-400 transition-colors p-3 -mx-3 rounded-xl hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20">
                <span>Painel do Supervisor</span>
                <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </DefaultLayout>
  );
}
