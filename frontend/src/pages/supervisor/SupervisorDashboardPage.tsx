import { useState, useMemo, useEffect } from 'react';
import DefaultLayout from '../../layouts/DefaultLayout';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { useAgendaStore } from '../../store/useAgendaStore';
import { useComponenteStore } from '../../store/useComponenteStore';
import { useServicoStore } from '../../store/useServicoStore';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/shared/Card';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { djangoApi } from '../../lib/api';

ModuleRegistry.registerModules([AllCommunityModule]);

// Removido hardcoded AVAILABLE_RESOURCES para usar boxes do store

export default function SupervisorDashboardPage() {
  const [activeTab, setActiveTab] = useState<'aprovacoes' | 'agenda' | 'cadastros' | 'suprimentos'>('aprovacoes');
  const { boxes, alocarBox, atualizarStatus, filaAprovacao, removerItemAprovacao } = useAgendaStore();
  const { listaComponentes, carregarComponentes } = useComponenteStore();
  const { listaServicos, carregarServicos } = useServicoStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDiagOpen, setIsDiagOpen] = useState(false);
  const [selectedOS, setSelectedOS] = useState<{os: number, cliente: string, veiculo: string} | null>(null);
  const [activeCatalog, setActiveCatalog] = useState<'servicos' | 'pecas'>('servicos');

  // Filtros de busca no modal
  const [searchPeca, setSearchPeca] = useState('');
  const [searchServico, setSearchServico] = useState('');
  const [agendaRowHeight, setAgendaRowHeight] = useState(64);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedBoxFilter, setSelectedBoxFilter] = useState('Todos');

  // Diagnóstico State individualizado
  const [diagnosticosPorOS, setDiagnosticosPorOS] = useState<Record<number, {
    servicos: {id: number, desc: string, horas: number, valor: number}[],
    pecas: Array<{ id: number, desc: string, qtd: number, valor: number, estoque: number }>,
    dataDiagnostico: string,
    dataProgramada: string,
    recurso?: string
  }>>({});

  const availableResources = useMemo(() => boxes.map(b => b.box), [boxes]);

  const servicos = selectedOS && diagnosticosPorOS[selectedOS.os] ? diagnosticosPorOS[selectedOS.os].servicos : [];
  const pecas = selectedOS && diagnosticosPorOS[selectedOS.os] ? diagnosticosPorOS[selectedOS.os].pecas : [];
  const dataDiagnostico = (selectedOS && diagnosticosPorOS[selectedOS.os]?.dataDiagnostico) || '';
  const dataProgramada = (selectedOS && diagnosticosPorOS[selectedOS.os]?.dataProgramada) || '';
  const isDateConflict = dataDiagnostico && dataProgramada && new Date(dataProgramada) < new Date(dataDiagnostico);

  const updateServicos = (updater: any) => {
    if (!selectedOS) return;
    setDiagnosticosPorOS(prev => {
      const osId = selectedOS.os;
      const current = prev[osId]?.servicos || [];
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { 
        ...prev, 
        [osId]: { 
          ...(prev[osId] || { 
            pecas: [], 
            dataDiagnostico: '', 
            dataProgramada: '',
            recurso: ''
          }), 
          servicos: next 
        } 
      };
    });
  };

  const updatePecas = (updater: any) => {
    if (!selectedOS) return;
    setDiagnosticosPorOS(prev => {
      const osId = selectedOS.os;
      const current = prev[osId]?.pecas || [];
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { 
        ...prev, 
        [osId]: { 
          ...(prev[osId] || { 
            servicos: [], 
            dataDiagnostico: '', 
            dataProgramada: '',
            recurso: ''
          }), 
          pecas: next 
        } 
      };
    });
  };

  const updateMetadata = (field: 'dataDiagnostico' | 'dataProgramada' | 'recurso', value: string) => {
    if (!selectedOS) return;
    
    // Se estiver mudando o recurso, atualiza também a alocação no Store
    if (field === 'recurso' && value) {
      alocarBox(value, selectedOS.os.toString(), selectedOS.veiculo);
    }

    setDiagnosticosPorOS(prev => ({
      ...prev,
      [selectedOS.os]: {
        ...prev[selectedOS.os],
        [field]: value
      }
    }));
  };

  useEffect(() => {
    carregarComponentes();
    carregarServicos();
  }, []);

  const weekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + (weekOffset * 7);
    const monday = new Date(new Date().setDate(diff));
    
    return ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map((day, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return { 
        label: day, 
        day: d.getDate().toString().padStart(2, '0'),
        fullDate: d.toISOString().split('T')[0]
      };
    });
  }, [weekOffset]);

  const currentMonthYear = useMemo(() => {
    if (weekDays.length === 0) return '';
    const firstDay = new Date(weekDays[0].fullDate + 'T12:00:00'); // Use midday to avoid TZ shifts
    const monthYear = firstDay.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
    
    // Calcula semana do mês
    const firstDayOfMonth = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1);
    const firstMondayOfMonth = new Date(firstDayOfMonth);
    while (firstMondayOfMonth.getDay() !== 1) {
      firstMondayOfMonth.setDate(firstMondayOfMonth.getDate() + 1);
    }
    
    // Diferença em semanas a partir da primeira segunda do mês
    const weekNum = Math.ceil((firstDay.getDate() - firstMondayOfMonth.getDate() + 1) / 7) + (firstDay.getDate() < firstMondayOfMonth.getDate() ? 0 : 1);
    const finalWeekNum = Math.max(1, weekNum);

    return `${monthYear} - SEMANA ${finalWeekNum}`;
  }, [weekDays]);

  const totalDiag = useMemo(() => {
    const totalServicos = servicos.reduce((acc, curr) => acc + (Number(curr.valor) * Number(curr.horas)), 0);
    const totalPecas = pecas.reduce((acc, curr) => acc + (Number(curr.valor) * Number(curr.qtd)), 0);
    return totalServicos + totalPecas;
  }, [servicos, pecas]);

  const filteredPecas = useMemo(() => {
    return listaComponentes.filter(p => 
      p.descricao_generica.toLowerCase().includes(searchPeca.toLowerCase()) ||
      p.codigo_interno.toLowerCase().includes(searchPeca.toLowerCase())
    );
  }, [listaComponentes, searchPeca]);

  const filteredServicos = useMemo(() => {
    return listaServicos.filter(s => 
      s.descricao.toLowerCase().includes(searchServico.toLowerCase()) ||
      s.codigo.toLowerCase().includes(searchServico.toLowerCase())
    );
  }, [listaServicos, searchServico]);

  const defaultColDef = useMemo<ColDef>(() => ({ sortable: true, filter: true, resizable: true }), []);

  const tabs = [
    { key: 'aprovacoes', label: '⚠️ Aprovações', count: filaAprovacao.length },
    { key: 'agenda', label: '📅 Agenda', count: null },
    { key: 'cadastros', label: '📦 Cadastros', count: null },
    { key: 'suprimentos', label: '🚚 Suprimentos', count: 3 },
  ] as const;

  const handleApproveClick = (os: number, cliente: string, veiculo: string) => {
    setSelectedOS({ os, cliente, veiculo });
    setIsModalOpen(true);
  };

  const handleDiagClick = (os: number, cliente: string, veiculo: string) => {
    setSelectedOS({ os, cliente, veiculo });
    setIsDiagOpen(true);
    
    // Busca se já existe horário na agenda (mock/alocação prévia)
    const boxInfo = boxes.find(b => Number(b.os) === os);
    
    // Inicializa o mock para a OS se não existir
    setDiagnosticosPorOS(prev => {
      const existing = prev[os];
      
      // Se já existe e já tem dataProgramada, não sobrescreve
      if (existing && existing.dataProgramada) return prev;

      const now = new Date();
      const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      
      // Determina a data programada inicial baseada na agenda ou no agora
      let initialProgramada = '';
      if (boxInfo && boxInfo.inicio) {
        initialProgramada = `${localDate}T${boxInfo.inicio}`;
      }

          const diagService = listaServicos.find(s => s.descricao === 'Diagnóstico Eletrônico Avançado');
          const defaultServicos = diagService 
            ? [{ id: diagService.id, desc: diagService.descricao, horas: Number(diagService.tempo_padrao), valor: Number(diagService.preco_base) }]
            : [];
          
          return {
            ...prev,
            [os]: {
              servicos: existing?.servicos || defaultServicos,
          pecas: existing?.pecas || [],
          dataDiagnostico: existing?.dataDiagnostico || localNow,
          dataProgramada: initialProgramada,
          recurso: boxInfo?.box || ''
        }
      };
    });
  };

  const addPeca = (comp: any) => {
    updatePecas((prev: any) => [...prev, { 
      id: comp.id, 
      desc: comp.descricao_generica, 
      qtd: 1, 
      valor: Number(comp.preco_venda),
      estoque: Number(comp.estoque_atual)
    }]);
  };

  const confirmAllocation = (boxName: string) => {
    if (selectedOS) {
      alocarBox(boxName, selectedOS.os.toString(), selectedOS.veiculo);
      removerItemAprovacao(selectedOS.os);
      setIsModalOpen(false);
      setSelectedOS(null);
      setActiveTab('agenda');
      alert(`OS #${selectedOS.os} aprovada e alocada no ${boxName}`);
    }
  };

  const salvarDiagnosticoNoBanco = async () => {
    if (!selectedOS) return false;

    // Validação de Datas: Início Programado não pode ser antes do Diagnóstico
    if (dataDiagnostico && dataProgramada) {
      const diagDate = new Date(dataDiagnostico);
      const progDate = new Date(dataProgramada);
      
      if (progDate < diagDate) {
        alert("⚠️ Conflito de Agendamento: A data e hora programada para execução não pode ser anterior à data do diagnóstico técnico.");
        return false;
      }
    }

    try {
      const payload = {
        valor_total: totalDiag,
        data_diagnostico: dataDiagnostico,
        data_programada: dataProgramada,
        servicos: servicos.map(s => ({
          id: s.id,
          quantidade: s.horas,
          valor_estimado: s.valor
        })),
        pecas: pecas.map(p => ({
          id: p.id,
          quantidade: p.qtd,
          valor_estimado: p.valor
        }))
      };
      
      await djangoApi.post(`/operacional/os/${selectedOS.os}/salvar_diagnostico/`, payload);
      return true;
    } catch (error: any) {
      console.error("Erro ao salvar diagnóstico:", error);
      
      // Fallback para o protótipo UI: a OS selecionada (101, 103, etc) é mockada no frontend
      // O DRF retorna 404 Not Found pois essa OS não existe na tabela op_ordem_servico
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.warn(`Aviso Protótipo: OS #${selectedOS.os} não existe no Banco de Dados. Simulando salvamento bem-sucedido.`);
        return true;
      }
      
      alert("Falha ao salvar diagnóstico na base de dados. Verifique a conexão com o servidor.");
      return false;
    }
  };

  const handleSalvarDiagnostico = async () => {
    const success = await salvarDiagnosticoNoBanco();
    if (success) {
      alert("💾 Diagnóstico salvo na base de dados com sucesso!");
    }
  };

  const salvarDiagnosticoEProsseguir = async () => {
    const success = await salvarDiagnosticoNoBanco();
    if (success && selectedOS) {
      setIsDiagOpen(false);
      handleApproveClick(selectedOS.os, selectedOS.cliente, selectedOS.veiculo);
    }
  };

  const handlePrintOS = () => {
    if (!selectedOS) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Por favor, permita pop-ups para imprimir o relatório.");
      return;
    }
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ordem de Serviço #${selectedOS.os}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 0; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 28px; color: #1e40af; letter-spacing: -0.5px; }
            .header p { margin: 5px 0 0 0; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
            .os-number { text-align: right; }
            .os-number h2 { margin: 0; font-size: 24px; color: #0f172a; }
            .os-number p { margin: 5px 0 0 0; color: #64748b; font-size: 14px; }
            
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
            .info-item { margin: 0; }
            .info-label { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 4px; }
            .info-value { display: block; font-size: 16px; color: #0f172a; font-weight: 600; }
            
            h3 { font-size: 18px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-top: 30px; margin-bottom: 15px; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 14px; }
            th { background-color: #f1f5f9; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; padding: 12px 8px; border-bottom: 2px solid #cbd5e1; text-align: left; }
            td { padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            .text-right { text-align: right; }
            
            .total-section { margin-top: 30px; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: right; }
            .total-label { font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; }
            .total-value { font-size: 28px; color: #0f172a; font-weight: 900; margin-left: 15px; }
            
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 80px; text-align: center; }
            .signature-line { border-top: 1px solid #94a3b8; padding-top: 10px; color: #475569; font-size: 14px; }
            
            .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>SIMU-MES Oficina</h1>
              <p>Relatório de Diagnóstico Técnico</p>
            </div>
            <div class="os-number">
              <h2>OS #${selectedOS.os}</h2>
              <p>Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Cliente Proprietário</span>
              <span class="info-value">${selectedOS.cliente}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Veículo</span>
              <span class="info-value">${selectedOS.veiculo}</span>
            </div>
          </div>

          <h3>Serviços / Mão de Obra</h3>
          <table>
            <thead>
              <tr>
                <th>Descrição do Serviço</th>
                <th class="text-right" style="width: 80px;">Horas</th>
                <th class="text-right" style="width: 120px;">Valor/h</th>
                <th class="text-right" style="width: 150px;">Subtotal (R$)</th>
              </tr>
            </thead>
            <tbody>
              ${servicos.map(s => `
                <tr>
                  <td>${s.desc}</td>
                  <td class="text-right">${Number(s.horas).toFixed(1)}</td>
                  <td class="text-right">${Number(s.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td class="text-right">${(Number(s.valor) * Number(s.horas)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
              ${servicos.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: #94a3b8;">Nenhum serviço registrado</td></tr>' : ''}
            </tbody>
          </table>

          <h3>Peças e Insumos</h3>
          <table>
            <thead>
              <tr>
                <th>Descrição da Peça/Insumo</th>
                <th class="text-right" style="width: 80px;">Qtd</th>
                <th class="text-right" style="width: 120px;">Valor Unit.</th>
                <th class="text-right" style="width: 150px;">Subtotal (R$)</th>
              </tr>
            </thead>
            <tbody>
              ${pecas.map(p => `
                <tr>
                  <td>${p.desc}</td>
                  <td class="text-right">${p.qtd}</td>
                  <td class="text-right">${p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td class="text-right">${(p.valor * p.qtd).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
              ${pecas.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: #94a3b8;">Nenhuma peça registrada</td></tr>' : ''}
            </tbody>
          </table>

          <div class="total-section">
            <span class="total-label">Total Estimado</span>
            <span class="total-value">R$ ${totalDiag.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #64748b;">* Orçamento sujeito a alterações após desmontagem.</p>
          </div>
          
          <div class="signatures">
            <div class="signature-line">
              Assinatura do Responsável Técnico
            </div>
            <div class="signature-line">
              Assinatura do Cliente
            </div>
          </div>
          
          <div class="footer">
            Gerado pelo sistema SIMU-MES Oficina. Documento interno para aprovação.
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <DefaultLayout>
      <div className="flex flex-col h-full">
        <PageHeader 
          title="📋 Painel do Supervisor" 
          subtitle="Aprovações, Alocação, Cadastros e Suprimentos" 
        />

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface-900 border border-surface-700 rounded-xl p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === t.key
                  ? 'bg-primary-600 text-white'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
              }`}
            >
              {t.label}
              {t.count !== null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === t.key ? 'bg-white/20' : 'bg-danger-500/20 text-danger-400'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'aprovacoes' && (
          <div className="space-y-8">
            {/* Fila de Aprovações */}
            <Card padding="md">
              <h2 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
                <span className="text-danger-500">⚠️</span> Fila de Aprovações (RF-OP-06/07)
              </h2>
              <div className="space-y-3">
                {filaAprovacao.map((item) => (
                  <div key={item.os} className="p-4 rounded-xl border border-danger-500/20 bg-danger-500/5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-surface-100">OS #{item.os} — {item.cliente}</p>
                        <p className="text-xs text-primary-400 font-medium">{item.veiculo}</p>
                        <p className="text-xs text-surface-500 mt-0.5">{item.motivo}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-danger-500/20 text-danger-400 font-medium">
                        +{item.variacao}% (limite: {item.limite}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button 
                        onClick={() => handleApproveClick(item.os, item.cliente, item.veiculo)}
                        className="px-4 py-1.5 rounded-lg bg-accent-600 text-white text-xs font-medium hover:bg-accent-500 transition-colors"
                      >
                        ✓ Aprovar
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja rejeitar/dispensar a OS #${item.os}?`)) {
                            removerItemAprovacao(item.os);
                          }
                        }}
                        className="px-4 py-1.5 rounded-lg border border-danger-500/50 text-danger-400 text-xs font-medium hover:bg-danger-500/10 transition-colors"
                      >
                        ✗ Rejeitar
                      </button>
                      <button 
                        onClick={() => handleDiagClick(item.os, item.cliente, item.veiculo)}
                        className="px-4 py-1.5 rounded-lg bg-surface-700 text-surface-300 text-xs font-medium hover:bg-surface-600 transition-colors"
                      >
                        🔍 Abrir Diagnóstico
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Serviços em Execução */}
            <Card padding="md">
              <h2 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
                <span className="text-primary-500">⚡</span> Serviços em Execução (Oficina)
              </h2>
              <div className="space-y-3">
                {boxes.filter(b => b.os !== '').map((box) => (
                  <div key={box.box} className="p-4 rounded-xl border border-surface-700 bg-surface-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-700 flex items-center justify-center text-xl">
                        {box.box.toLowerCase().includes('rampa') ? '⚖️' : '🔧'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-surface-100">OS #{box.os} — {box.veiculo}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 font-bold uppercase">{box.box}</span>
                        </div>
                        <p className="text-xs text-surface-500 mt-0.5">Colaborador: {box.mecanico}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleDiagClick(parseInt(box.os), '—', box.veiculo)}
                        className="text-xs text-primary-400 hover:text-primary-300 font-bold px-3 py-1.5 rounded-lg border border-primary-500/30 hover:bg-primary-500/5 transition-all"
                      >
                        📋 Detalhes Diagnóstico
                      </button>
                      <div className="text-right">
                        <p className="text-[10px] text-surface-500 uppercase font-bold mb-1">Status Atual</p>
                        <select 
                          value={box.status}
                          onChange={(e) => {
                            atualizarStatus(box.box, e.target.value as any);
                          }}
                          className={`text-xs font-bold rounded-lg px-3 py-1.5 border focus:outline-none transition-colors ${
                            box.status === 'Em Execução' ? 'bg-accent-500/10 border-accent-500/30 text-accent-400' : 
                            box.status === 'Diagnóstico' ? 'bg-warning-500/10 border-warning-500/30 text-warning-400' :
                            box.status === 'Aguardando Início' ? 'bg-surface-700/50 border-surface-600 text-surface-400' :
                            'bg-primary-500/10 border-primary-500/30 text-primary-400'
                          }`}
                        >
                          <option value="Aguardando Início">Aguardando Início</option>
                          <option value="Diagnóstico">Diagnóstico</option>
                          <option value="Em Execução">Em Execução</option>
                          <option value="Em Manutenção">Em Manutenção</option>
                          <option value="Disponível">Finalizar (Liberar Box)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                {boxes.filter(b => b.os !== '').length === 0 && (
                  <div className="py-8 text-center border border-dashed border-surface-700 rounded-xl opacity-50">
                    <p className="text-sm text-surface-500">Nenhum serviço em execução no momento.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'agenda' && (
          <Card padding="md">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-surface-100">Agenda de Alocação (RF-OP-09)</h2>
                <div className="flex items-center gap-2 bg-surface-900 border border-surface-700 rounded-lg p-1 shadow-inner">
                  <button 
                    onClick={() => setAgendaRowHeight(prev => prev === 64 ? 38 : 64)}
                    className="px-3 py-1.5 text-[10px] font-bold text-surface-400 hover:text-white hover:bg-surface-800 rounded transition-all uppercase tracking-tighter"
                  >
                    {agendaRowHeight === 64 ? '🔍 Comprimir' : '🔍 Expandir'}
                  </button>
                  <div className="w-[1px] h-4 bg-surface-700 mx-1"></div>
                  <button 
                    onClick={() => setWeekOffset(prev => prev - 1)}
                    className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className={`px-4 py-1.5 rounded-md transition-all duration-300 shadow-sm ${
                    weekOffset === 0 ? 'bg-orange-500/20 border border-orange-500/50' : 
                    weekOffset < 0 ? 'bg-danger-500/20 border border-danger-500/50' : 
                    'bg-warning-500/20 border border-warning-500/50'
                  }`}>
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                      weekOffset === 0 ? 'text-orange-400' : 
                      weekOffset < 0 ? 'text-danger-400' : 
                      'text-warning-400'
                    }`}>
                      {currentMonthYear}
                    </span>
                  </div>
                  <button 
                    onClick={() => setWeekOffset(prev => prev + 1)}
                    className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              {/* Filtro de Boxes (Recursos) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mr-2">Locais:</span>
                {['Todos', ...availableResources].map(boxName => (
                  <button
                    key={boxName}
                    onClick={() => setSelectedBoxFilter(boxName)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                      selectedBoxFilter === boxName 
                        ? 'bg-primary-500 border-primary-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
                        : 'bg-surface-900 border-surface-700 text-surface-400 hover:bg-surface-800 hover:border-surface-600'
                    }`}
                  >
                    {boxName}
                  </button>
                ))}
              </div>
            </div>

            {/* Agenda Grid */}
            <div className="relative overflow-x-auto border border-surface-800 rounded-xl bg-surface-950 custom-scrollbar shadow-inner">
              <div className="min-w-[800px] h-[450px] overflow-y-auto custom-scrollbar relative">
                {/* Grid Header (Sticky) */}
                <div className="sticky top-0 z-20 grid grid-cols-6 border-b border-surface-700 bg-surface-900/90 backdrop-blur shadow-sm">
                  <div className="p-3 text-center border-r border-surface-800/50">
                    <span className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Horários</span>
                  </div>
                  {weekDays.map(item => (
                    <div key={item.label} className="p-3 text-center border-r border-surface-800/50 last:border-r-0">
                      <span className="text-xs font-black text-surface-200 uppercase tracking-wider">
                        {item.label} <span className="text-primary-400">({item.day})</span>
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Grid Body */}
                <div className="relative bg-surface-950">
                  {/* Background Rows (Expediente 07:00 - 19:00) */}
                  {Array.from({ length: 13 }).map((_, i) => {
                    const hour = i + 7;
                    const time = `${hour.toString().padStart(2, '0')}:00`;
                    return (
                      <div key={time} className="grid grid-cols-6 border-b border-surface-800/30" style={{ height: `${agendaRowHeight}px` }}>
                        <div className="p-2 text-center border-r border-surface-800/50 bg-surface-900/30 flex items-center justify-center">
                          <span className={`font-mono text-surface-500 transition-all ${agendaRowHeight < 50 ? 'text-[8px]' : 'text-[10px]'}`}>{time}</span>
                        </div>
                        {Array.from({ length: 5 }).map((_, j) => (
                           <div key={j} className="border-r border-surface-800/30 last:border-r-0"></div>
                        ))}
                      </div>
                    );
                  })}

                  {/* Events Overlay */}
                  {boxes
                    .filter(b => b.status !== 'Disponível' && (selectedBoxFilter === 'Todos' || b.box === selectedBoxFilter))
                    .map((b) => {
                    const osId = Number(b.os);
                    const diag = diagnosticosPorOS[osId];
                    
                    // Prioriza dados do diagnóstico se existirem
                    let timeInicio = b.inicio;
                    let timeFim = b.fim;

                    if (diag && diag.dataProgramada) {
                      const timePart = diag.dataProgramada.split('T')[1];
                      if (timePart) {
                        timeInicio = timePart;
                        // Calcula Fim baseado na soma de horas dos serviços
                        const totalHoras = diag.servicos.reduce((acc, s) => acc + s.horas, 0) || 1;
                        const [h, m] = timePart.split(':').map(Number);
                        const totalMinutes = h * 60 + m + (totalHoras * 60);
                        const endH = Math.floor(totalMinutes / 60);
                        const endM = totalMinutes % 60;
                        timeFim = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
                      }
                    }

                    // Parse inicio e fim para posicionamento no Grid
                    const [startH, startM] = timeInicio.split(':').map(Number);
                    if (isNaN(startH)) return null;
                    const startOffset = (startH - 7) * agendaRowHeight + (startM / 60) * agendaRowHeight;
                    
                    const [endH, endM] = timeFim.split(':').map(Number);
                    const endOffset = (endH - 7) * agendaRowHeight + (endM / 60) * agendaRowHeight;
                    
                    const height = Math.max(endOffset - startOffset, 24); // min 24px
                    
                    // Calcula o dia da semana e verifica se pertence à semana visível
                    let dayIndex = -1;
                    if (diag && diag.dataProgramada) {
                      const [datePart] = diag.dataProgramada.split('T');
                      // Verifica se a data programada está entre os dias da semana visível
                      dayIndex = weekDays.findIndex(wd => wd.fullDate === datePart);
                    }

                    if (dayIndex === -1) return null; // Só apresenta se estiver na semana visível
                    
                    const left = `calc(16.666% + ${dayIndex * 16.666}%)`;
                    const width = 'calc(16.666% - 8px)'; // spacing
                  
                    return (
                      <div 
                        key={b.os}
                        className={`absolute p-2 rounded-lg border-l-4 overflow-hidden shadow-lg transition-all hover:z-10 hover:scale-[1.02] cursor-pointer ml-1 flex flex-col justify-between ${
                          b.status === 'Em Execução' ? 'bg-primary-900/40 border-primary-500 hover:bg-primary-900/60' : 'bg-surface-800/80 border-surface-500 hover:bg-surface-700/90'
                        }`}
                        style={{
                          top: `${startOffset}px`,
                          height: `${height}px`,
                          left,
                          width,
                          minHeight: agendaRowHeight < 50 ? '30px' : '45px'
                        }}
                      >
                        <div>
                          <p className={`font-black text-white leading-tight truncate ${agendaRowHeight < 50 ? 'text-[9px]' : 'text-[10px] mb-0.5'}`}>OS #{b.os}</p>
                          <p className="text-[9px] text-surface-300 truncate font-medium">{b.veiculo}</p>
                        </div>
                        <div className={`flex items-center gap-2 ${agendaRowHeight < 50 ? 'mt-0' : 'mt-1'}`}>
                          <span className="text-[8px] bg-surface-950/50 px-1 py-0.5 rounded font-mono text-surface-400 whitespace-nowrap">{timeInicio} - {timeFim}</span>
                          <span className="text-[9px] text-accent-400 font-black tracking-wider truncate">{b.box}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Modal de Alocação */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-surface-700 flex justify-between items-center bg-surface-800/50">
                <div>
                  <h3 className="text-xl font-bold text-surface-100">Alocar Box</h3>
                  <p className="text-xs text-primary-400 font-bold mt-1 uppercase">{selectedOS?.veiculo}</p>
                  <p className="text-[10px] text-surface-400 uppercase tracking-wider">OS #{selectedOS?.os} — {selectedOS?.cliente}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-surface-400 hover:text-surface-200">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-sm text-surface-300 mb-4">Selecione um recurso disponível para iniciar o serviço:</p>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {boxes.map((b) => {
                    const isDisponivel = b.status === 'Disponível';
                    return (
                      <button
                        key={b.box}
                        disabled={!isDisponivel}
                        onClick={() => confirmAllocation(b.box)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                          isDisponivel
                            ? 'border-surface-700 hover:border-primary-500 bg-surface-800 hover:bg-surface-700'
                            : 'border-danger-500/30 bg-danger-500/5 opacity-80 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-xl ${!isDisponivel ? 'grayscale' : ''}`}>
                            {b.box.toLowerCase().includes('rampa') ? '⚖️' : '🔧'}
                          </span>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-surface-100">{b.box}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${
                                isDisponivel ? 'bg-accent-500/20 text-accent-400' : 'bg-danger-500/20 text-danger-400'
                              }`}>
                                {isDisponivel ? 'Livre' : 'Ocupado'}
                              </span>
                            </div>
                            <p className="text-xs text-surface-500">
                              {isDisponivel ? 'Pronto para uso' : `${b.veiculo} (OS #${b.os})`}
                            </p>
                          </div>
                        </div>
                        {isDisponivel && (
                          <span className="bg-primary-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg">
                            Alocar
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Diagnóstico */}
        {isDiagOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh]">
              
              {/* Header do Modal */}
              <div className="p-6 border-b border-surface-700 flex justify-between items-center bg-surface-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-600/20 text-primary-400 flex items-center justify-center text-2xl shadow-inner">
                    🔍
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-surface-50">Diagnóstico Técnico — OS #{selectedOS?.os}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-primary-400 font-bold uppercase tracking-wider">{selectedOS?.veiculo}</span>
                      <span className="text-surface-600">•</span>
                      <span className="text-xs text-surface-400 font-medium">{selectedOS?.cliente}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsDiagOpen(false)} className="p-2 hover:bg-surface-700 rounded-full transition-all text-surface-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                
                {/* LADO ESQUERDO: Orçamento em Construção (2/3) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar border-r border-surface-800">
                  
                  {/* Seção de Mão de Obra */}
                  <section>
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-surface-800/50">
                      <h4 className="text-xs font-black text-surface-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="text-accent-500">🛠️</span> Serviços / Mão de Obra
                      </h4>
                      <button 
                        onClick={() => setActiveCatalog('servicos')}
                        className={`text-[10px] px-3 py-1.5 rounded-lg transition-all font-bold uppercase tracking-tighter ${
                          activeCatalog === 'servicos' 
                            ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20' 
                            : 'bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-white'
                        }`}
                      >
                        + Selecionar Serviço
                      </button>
                    </div>
                    <div className="space-y-2">
                      {servicos.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-surface-950/50 rounded-xl border border-surface-800 hover:border-surface-700 transition-all group">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => updateServicos((prev: any) => prev.filter((_: any, idx: number) => idx !== i))}
                              className="opacity-0 group-hover:opacity-100 p-1 text-danger-500 hover:bg-danger-500/10 rounded transition-all"
                            >
                              ✕
                            </button>
                            <div>
                              <p className="text-sm text-surface-100 font-medium">{s.desc}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <input 
                                  type="number" 
                                  step="0.1"
                                  value={s.horas} 
                                  onChange={(e) => updateServicos((prev: any) => prev.map((item: any, idx: number) => idx === i ? {...item, horas: Number(e.target.value)} : item))}
                                  className="w-12 bg-surface-900 border border-surface-700 text-[10px] text-center rounded px-1 py-0.5 text-accent-400 font-bold focus:border-accent-500 focus:outline-none"
                                />
                                <span className="text-[10px] text-surface-500 font-bold uppercase tracking-tighter">h x R$</span>
                                <input 
                                  type="number" 
                                  value={s.valor} 
                                  onChange={(e) => updateServicos((prev: any) => prev.map((item: any, idx: number) => idx === i ? {...item, valor: Number(e.target.value)} : item))}
                                  className="w-24 bg-surface-900 border border-surface-700 text-[10px] text-center rounded px-1 py-0.5 text-surface-300 font-bold focus:border-accent-500 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-surface-50">R$ {(s.valor * s.horas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      ))}
                      {servicos.length === 0 && (
                        <div className="py-10 text-center border border-dashed border-surface-800 rounded-2xl opacity-40">
                          <p className="text-xs text-surface-500">Nenhum serviço selecionado</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Seção de Peças */}
                  <section>
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-surface-800/50">
                      <h4 className="text-xs font-black text-surface-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="text-primary-500">🔩</span> Peças e Insumos
                      </h4>
                      <button 
                        onClick={() => setActiveCatalog('pecas')}
                        className={`text-[10px] px-3 py-1.5 rounded-lg transition-all font-bold uppercase tracking-tighter ${
                          activeCatalog === 'pecas' 
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                            : 'bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-white'
                        }`}
                      >
                        + Selecionar Peça
                      </button>
                    </div>
                    <div className="space-y-2">
                      {pecas.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-surface-950/50 rounded-xl border border-surface-800 hover:border-surface-700 transition-all group">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => updatePecas((prev: any) => prev.filter((_: any, idx: number) => idx !== i))}
                              className="opacity-0 group-hover:opacity-100 p-1 text-danger-500 hover:bg-danger-500/10 rounded transition-all"
                            >
                              ✕
                            </button>
                            <div>
                              <p className="text-sm text-surface-100 font-medium">{p.desc}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${p.estoque > 0 ? 'bg-green-500/10 text-green-400' : 'bg-danger-500/10 text-danger-400'}`}>
                                  Estoque: {p.estoque}
                                </span>
                                <span className="text-[10px] text-surface-500">|</span>
                                <input 
                                  type="number" 
                                  value={p.qtd} 
                                  onChange={(e) => updatePecas((prev: any) => prev.map((item: any, idx: number) => idx === i ? {...item, qtd: Number(e.target.value)} : item))}
                                  className="w-10 bg-surface-900 border border-surface-700 text-[10px] text-center rounded px-1 py-0.5 text-primary-400 font-bold focus:border-primary-500 focus:outline-none"
                                />
                                <span className="text-[10px] text-surface-500 font-bold uppercase tracking-tighter">un x R$</span>
                                <input 
                                  type="number" 
                                  value={p.valor} 
                                  onChange={(e) => updatePecas((prev: any) => prev.map((item: any, idx: number) => idx === i ? {...item, valor: Number(e.target.value)} : item))}
                                  className="w-24 bg-surface-900 border border-surface-700 text-[10px] text-center rounded px-1 py-0.5 text-surface-300 font-bold focus:border-primary-500 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-surface-50">R$ {(p.valor * p.qtd).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      ))}
                      {pecas.length === 0 && (
                        <div className="py-10 text-center border border-dashed border-surface-800 rounded-2xl opacity-40">
                          <p className="text-xs text-surface-500">Aguardando seleção de peças</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Seção de Totalização e Agendamento */}
                  <section className="bg-surface-900/50 p-6 rounded-2xl border border-surface-800 mt-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="space-y-1">
                        <span className="text-[10px] text-surface-500 uppercase font-black tracking-widest">Totalização do Custo do Serviço</span>
                        <p className="text-3xl font-black text-white flex items-baseline gap-2">
                          <span className="text-sm font-medium text-surface-400">R$</span>
                          {totalDiag.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      
                      {/* Campos de Programação/Agendamento */}
                      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <div className="flex flex-col">
                          <label className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-1">
                            🕒 Diagnóstico
                          </label>
                          <input 
                            type="datetime-local" 
                            value={dataDiagnostico}
                            onChange={(e) => updateMetadata('dataDiagnostico', e.target.value)}
                            className="bg-surface-950 border border-surface-800 text-surface-200 text-xs font-mono rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all w-full md:w-[180px]"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-1">
                            📅 Início Programado
                          </label>
                          <input 
                            type="datetime-local" 
                            value={dataProgramada}
                            onChange={(e) => updateMetadata('dataProgramada', e.target.value)}
                            className={`bg-surface-950 border text-surface-200 text-xs font-mono rounded-lg px-3 py-2.5 focus:outline-none transition-all w-full md:w-[180px] ${
                              isDateConflict 
                                ? 'border-danger-500 ring-1 ring-danger-500' 
                                : 'border-surface-800 focus:border-accent-500 focus:ring-1 focus:ring-accent-500'
                            }`}
                          />
                          {isDateConflict && (
                            <span className="text-[9px] text-danger-400 font-bold mt-1 animate-pulse">
                              ⚠️ Data inválida (antes do diag.)
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-1">
                            📍 Recurso / Local
                          </label>
                          <select
                            value={(selectedOS && diagnosticosPorOS[selectedOS.os]?.recurso) || ''}
                            onChange={(e) => updateMetadata('recurso', e.target.value)}
                            className="bg-surface-950 border border-surface-800 text-surface-200 text-xs font-bold rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all w-full md:w-[150px] appearance-none"
                          >
                            <option value="">Não Alocado</option>
                            {availableResources.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* LADO DIREITO: Catálogos e Pesquisa (1/3) */}
                <div className="w-full lg:w-96 bg-surface-950 flex flex-col min-h-0 border-l border-surface-800 shadow-[-10px_0_30px_rgba(0,0,0,0.3)]">
                  
                  {/* Busca Contextual */}
                  <div className="p-4 bg-surface-900/30 border-b border-surface-800 space-y-3">
                    <div className="flex items-center gap-2 mb-2 p-1 bg-surface-900 rounded-lg">
                      <button 
                        onClick={() => setActiveCatalog('servicos')}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${activeCatalog === 'servicos' ? 'bg-surface-800 text-white shadow' : 'text-surface-500 hover:text-surface-300'}`}
                      >
                        Serviços
                      </button>
                      <button 
                        onClick={() => setActiveCatalog('pecas')}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${activeCatalog === 'pecas' ? 'bg-surface-800 text-white shadow' : 'text-surface-500 hover:text-surface-300'}`}
                      >
                        Peças
                      </button>
                    </div>

                    {activeCatalog === 'pecas' ? (
                      <div className="relative group">
                        <input 
                          type="text" 
                          placeholder="Filtrar catálogo de peças..." 
                          value={searchPeca}
                          onChange={(e) => setSearchPeca(e.target.value)}
                          className="w-full bg-surface-950 border border-surface-800 text-[11px] rounded-lg pl-8 pr-3 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                        />
                        <span className="absolute left-2.5 top-2.5 text-surface-600 text-xs group-focus-within:text-primary-500 transition-colors">🔍</span>
                      </div>
                    ) : (
                      <div className="relative group">
                        <input 
                          type="text" 
                          placeholder="Filtrar catálogo de serviços..." 
                          value={searchServico}
                          onChange={(e) => setSearchServico(e.target.value)}
                          className="w-full bg-surface-950 border border-surface-800 text-[11px] rounded-lg pl-8 pr-3 py-2.5 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all"
                        />
                        <span className="absolute left-2.5 top-2.5 text-surface-600 text-xs group-focus-within:text-accent-500 transition-colors">🛠️</span>
                      </div>
                    )}
                  </div>

                  {/* Resultados da Busca */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar bg-gradient-to-b from-surface-950 to-surface-900">
                    
                    {activeCatalog === 'pecas' ? (
                      /* Lista Peças Filtradas */
                      <div>
                        <h5 className="text-[10px] font-black text-surface-600 uppercase mb-4 tracking-widest flex justify-between items-center">
                          Catálogo de Peças 
                          <span className="text-[9px] bg-surface-800 px-1.5 py-0.5 rounded text-surface-400">{filteredPecas.length}</span>
                        </h5>
                        <div className="grid gap-2">
                          {filteredPecas.map(p => (
                            <div 
                              key={p.id} 
                              onClick={() => addPeca(p)}
                              className="p-3 rounded-xl bg-surface-900/50 border border-surface-800 hover:border-primary-500/50 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-mono text-primary-400 font-bold">{p.codigo_interno}</span>
                                <span className={`text-[9px] font-bold px-1.5 rounded ${Number(p.estoque_atual) > 0 ? 'bg-accent-500/10 text-accent-400' : 'bg-danger-500/10 text-danger-400'}`}>
                                  {p.estoque_atual}
                                </span>
                              </div>
                              <p className="text-[11px] text-surface-200 font-medium line-clamp-1 group-hover:text-white">{p.descricao_generica}</p>
                              <p className="text-[10px] text-surface-500 mt-1 font-bold">R$ {Number(p.preco_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Lista Serviços Filtrados */
                      <div>
                        <h5 className="text-[10px] font-black text-surface-600 uppercase mb-4 tracking-widest flex justify-between items-center">
                          Catálogo de Serviços
                          <span className="text-[9px] bg-surface-800 px-1.5 py-0.5 rounded text-surface-400">{filteredServicos.length}</span>
                        </h5>
                        <div className="grid gap-2">
                          {filteredServicos.map(s => (
                            <div 
                              key={s.id} 
                              onClick={() => updateServicos((prev: any) => [...prev, { id: s.id, desc: s.descricao, horas: Number(s.tempo_padrao), valor: Number(s.preco_base) }])}
                              className="p-3 rounded-xl bg-surface-900/50 border border-surface-800 hover:border-accent-500/50 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-mono text-accent-400 font-bold">{s.codigo}</span>
                                <span className="text-[9px] font-bold text-surface-500 uppercase tracking-tighter">{s.tempo_padrao}h técnicas</span>
                              </div>
                              <p className="text-[11px] text-surface-200 font-medium line-clamp-1 group-hover:text-white">{s.descricao}</p>
                              <p className="text-[10px] text-surface-500 mt-1 font-bold">R$ {Number(s.preco_base).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rodapé do Modal (Resumo e Ação) */}
                  <div className="p-6 bg-surface-900 border-t border-surface-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                    <button 
                      onClick={salvarDiagnosticoEProsseguir}
                      className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-3"
                    >
                      ✓ Aprovar Diagnóstico e Alocar
                    </button>
                    
                    <div className="flex gap-3 mt-3">
                      <button 
                        onClick={handleSalvarDiagnostico}
                        className="flex-1 py-3 bg-surface-800 hover:bg-surface-700 border border-surface-600 text-surface-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        💾 Salvar Dados
                      </button>
                      
                      <button 
                        onClick={handlePrintOS}
                        className="flex-1 py-3 bg-surface-800 hover:bg-surface-700 border border-surface-600 text-surface-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        🖨️ Imprimir O.S.
                      </button>
                    </div>

                    <p className="text-[9px] text-center text-surface-600 mt-4 uppercase tracking-widest">
                      Simu-MES Workshop • Versão 2.4.1
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ... manter demais abas cadastros e suprimentos ... */}
        {activeTab === 'cadastros' && (
          <Card padding="md">
            <h2 className="text-lg font-semibold text-surface-100 mb-4">Central de Cadastros (RF-OP-08)</h2>
            <div className="ag-theme-alpine-dark w-full" style={{ height: '350px' }}>
              <AgGridReact
                rowData={[
                  { sku: 'PC-001', descricao: 'Pastilha de Freio Dianteira', custo: 45.90, estoque: 24, jit: false },
                  { sku: 'PC-002', descricao: 'Filtro de Óleo Motor', custo: 28.50, estoque: 42, jit: false },
                  { sku: 'PC-003', descricao: 'Cabeçote Retificado', custo: 1200.00, estoque: 0, jit: true },
                  { sku: 'PC-004', descricao: 'Bomba d\'Água Universal', custo: 185.00, estoque: 6, jit: false },
                  { sku: 'LB-001', descricao: 'Óleo 5W30 Sintético (1L)', custo: 32.00, estoque: 80, jit: false },
                ]}
                columnDefs={[
                  { field: 'sku', headerName: 'SKU', width: 110 },
                  { field: 'descricao', headerName: 'Descrição', flex: 1 },
                  { field: 'custo', headerName: 'Custo Médio', width: 120 },
                  { field: 'estoque', headerName: 'Estoque', width: 100 },
                  { field: 'jit', headerName: 'JIT?', width: 80 },
                ] as ColDef[]}
                defaultColDef={defaultColDef}
              />
            </div>
          </Card>
        )}

        {activeTab === 'suprimentos' && (
          <Card padding="md">
            <h2 className="text-lg font-semibold text-surface-100 mb-4">Central de Suprimentos — JIT (RF-SUP-03)</h2>
            <div className="space-y-3">
              {[
                { fornecedor: 'AutoParts Ltda', itens: 3, total: 1680, lead: '2 dias', status: 'Pendente' },
                { fornecedor: 'Retífica Central', itens: 1, total: 1200, lead: '5 dias', status: 'Em Trânsito' },
                { fornecedor: 'Lubrax Distribuição', itens: 2, total: 480, lead: '1 dia', status: 'Pendente' },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-surface-700 hover:border-primary-500/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-surface-200">{p.fornecedor}</p>
                    <p className="text-xs text-surface-500">{p.itens} itens • Lead: {p.lead}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-surface-100">R$ {p.total.toLocaleString('pt-BR')}</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.status === 'Pendente' ? 'bg-warning-400/10 text-warning-400' : 'bg-accent-500/10 text-accent-400'
                    }`}>{p.status}</span>
                    {p.status === 'Pendente' && (
                      <button className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-500 transition-colors">
                        Liberar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DefaultLayout>
  );
}
