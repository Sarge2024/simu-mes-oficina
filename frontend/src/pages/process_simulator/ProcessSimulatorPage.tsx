import DefaultLayout from '../../layouts/DefaultLayout';

export default function ProcessSimulatorPage() {
  return (
    <DefaultLayout>
      <div className="p-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-surface-50">Process Simulator</h1>
          <p className="text-sm text-surface-700 mt-1">Simulação de processos e cálculos de Ponto de Equilíbrio</p>
        </header>

        <div className="bg-surface-900 border border-surface-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-surface-100 mb-4">Simulador</h2>
          <p className="text-surface-700 text-sm">Interface do Process Simulator será renderizada aqui.</p>
        </div>
      </div>
    </DefaultLayout>
  );
}
