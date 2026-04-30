import AgentModelerLayout from '../../layouts/AgentModelerLayout';

export default function AgentModelerPage() {
  return (
    <AgentModelerLayout>
      <div className="p-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-accent-400">Agent Modeler</h1>
          <p className="text-sm text-surface-700 mt-1">Dashboard isolado para modelagem de agentes</p>
        </header>

        <div className="bg-surface-900 border border-accent-500/20 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-surface-100 mb-4">Agents Overview</h2>
          <p className="text-surface-700 text-sm">Painel do Agent Modeler será renderizado aqui.</p>
        </div>
      </div>
    </AgentModelerLayout>
  );
}
