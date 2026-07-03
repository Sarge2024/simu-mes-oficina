import DefaultLayout from '../../layouts/DefaultLayout';
import Card from '../../components/shared/Card';

export default function ProcessSimulatorPage() {
  return (
    <DefaultLayout>
      <div className="p-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-surface-50">Process Simulator</h1>
          <p className="text-sm text-surface-700 mt-1">Simulação de processos e cálculos de Ponto de Equilíbrio</p>
        </header>

        <Card padding="md">
          <h2 className="text-lg font-semibold text-surface-100 mb-4">Simulador</h2>
          <p className="text-surface-700 text-sm">Interface do Process Simulator será renderizada aqui.</p>
        </Card>
      </div>
    </DefaultLayout>
  );
}
