import { useState, useEffect, useMemo, useRef } from 'react';
import { useVehicleStore, type Versao } from '../../store/useVehicleStore';
import DefaultLayout from '../../layouts/DefaultLayout';
import Card from '../../components/shared/Card';
import { read, utils } from 'xlsx';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, SelectionChangedEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const COMBUSTIVEL_MAP: Record<string, string> = {
  'Flex': 'F',
  'Gasolina': 'G',
  'Diesel': 'D',
  'Elétrico': 'E',
  'Híbrido': 'H',
  'Álcool': 'A',
};

const COMBUSTIVEL_REVERSE: Record<string, string> = {
  'F': 'Flex',
  'G': 'Gasolina',
  'D': 'Diesel',
  'E': 'Elétrico',
  'H': 'Híbrido',
  'A': 'Álcool',
};

export default function VeiculoCatalogoPage() {
  const { 
    listaCatalogo,
    isLoading,
    carregarCatalogoCompleto,
    carregarMarcas,
    listaMarcas,
    carregarCategorias,
    listaCategorias,
    criarMarca,
    criarModelo,
    criarVersao,
    atualizarVersao,
    isSaving,
    listaModelosFiltrados,
    selecionarMarca
  } = useVehicleStore();

  const [searchTerm, setSearchTerm] = useState('');
  const gridRef = useRef<AgGridReact>(null);
  const shouldAbortImport = useRef(false);

  const [selectedItem, setSelectedItem] = useState<Partial<Versao> | null>(null);
  const [showVeiculoModal, setShowVeiculoModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    categoriaId: '',
    marcaId: '',
    marcaNome: '',
    modeloId: '',
    modeloNome: '',
    versaoNome: '',
    motor: '',
    combustivel: ''
  });
  const [formData, setFormData] = useState({
    categoriaId: '',
    marcaId: '',
    marcaNome: '',
    modeloId: '',
    modeloNome: '',
    versaoNome: '',
    motor: '',
    combustivel: ''
  });

  const [appliedFilters, setAppliedFilters] = useState<typeof formData | null>(null);

  const [showMarcaModal, setShowMarcaModal] = useState(false);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newMarcaName, setNewMarcaName] = useState('');

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importLog, setImportLog] = useState<string[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingError, setPendingError] = useState<{message: string, resolve: (proceed: boolean) => void} | null>(null);

  const waitForUserDecision = (message: string) => {
    return new Promise<boolean>((resolve) => {
      setPendingError({ message, resolve });
    });
  };

  useEffect(() => {
    carregarCatalogoCompleto();
    carregarMarcas();
    carregarCategorias();
  }, [carregarCatalogoCompleto, carregarMarcas, carregarCategorias]);

  const listaCatalogoFiltrada = useMemo(() => {
    const activeMarcaIds = new Set(listaMarcas.filter(m => m.ativo).map(m => m.id));
    let result = listaCatalogo.filter((item) => activeMarcaIds.has((item as Versao & { marca_id: number }).marca_id));

    if (appliedFilters) {
      if (appliedFilters.categoriaId) {
        // As it's related to the model, the backend doesn't currently return `categoria_id` in `Versao` but in `serializers.py` we saw `categoria = serializers.IntegerField(source='modelo.categoria_id')`. So it's `item.categoria`.
        result = result.filter(item => String((item as any).categoria) === appliedFilters.categoriaId);
      }
      if (appliedFilters.marcaId) {
        result = result.filter(item => String((item as any).marca_id) === appliedFilters.marcaId);
      }
      if (appliedFilters.modeloNome) {
        const terms = appliedFilters.modeloNome.toLowerCase().trim().split(/\s+/);
        result = result.filter(item => {
          const v = (item as any).modelo_nome?.toString().toLowerCase() || '';
          return terms.every(t => v.includes(t));
        });
      }
      if (appliedFilters.versaoNome) {
        const terms = appliedFilters.versaoNome.toLowerCase().trim().split(/\s+/);
        result = result.filter(item => {
          const v = (item.nome_versao || '').toLowerCase();
          return terms.every(t => v.includes(t));
        });
      }
      if (appliedFilters.motor) {
        const terms = appliedFilters.motor.toLowerCase().trim().split(/\s+/);
        result = result.filter(item => {
          const v = (item.motorizacao || '').toLowerCase();
          return terms.every(t => v.includes(t));
        });
      }
      if (appliedFilters.combustivel) {
        const combMapReverse = { 'Flex': 'F', 'Gasolina': 'G', 'Diesel': 'D', 'Híbrido': 'H', 'Elétrico': 'E', 'Álcool': 'A' } as Record<string, string>;
        const code = combMapReverse[appliedFilters.combustivel] || appliedFilters.combustivel;
        result = result.filter(item => item.combustivel === code || COMBUSTIVEL_REVERSE[item.combustivel] === appliedFilters.combustivel);
      }
    }
    
    return result;
  }, [listaCatalogo, listaMarcas, appliedFilters]);

  const columnDefs = useMemo<ColDef[]>(() => [
    { field: 'marca_nome', headerName: 'Marca', sortable: true, filter: true, flex: 1 },
    { field: 'modelo_nome', headerName: 'Modelo', sortable: true, filter: true, flex: 1 },
    { field: 'nome_versao', headerName: 'Versão', sortable: true, filter: true, flex: 1.5 },
    { field: 'motorizacao', headerName: 'Motor', sortable: true, filter: true, flex: 0.8 },
    { 
      field: 'combustivel', 
      headerName: 'Combustível', 
      sortable: true, 
      filter: true, 
      flex: 0.8,
      valueGetter: (params) => COMBUSTIVEL_REVERSE[params.data.combustivel] || params.data.combustivel
    },
    { 
      field: 'ativo', 
      headerName: 'Status', 
      width: 100,
      cellRenderer: (params: { value: boolean }) => (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${params.value ? 'bg-green-500/20 text-green-400' : 'bg-danger-500/20 text-danger-400'}`}>
          {params.value ? 'ATIVO' : 'INATIVO'}
        </span>
      )
    }
  ], []);

  const onSelectionChanged = (event: SelectionChangedEvent) => {
    const selectedRows = event.api.getSelectedRows();
    if (selectedRows.length > 0) {
      setSelectedItem(selectedRows[0]);
    } else {
      setSelectedItem(null);
    }
  };

const resetFormData = () => {
    setFormData({
      categoriaId: '',
      marcaId: '',
      marcaNome: '',
      modeloId: '',
      modeloNome: '',
      versaoNome: '',
      motor: '',
      combustivel: ''
    });
    setSelectedItem(null);
    setAppliedFilters(null);
  };

  const handlePesquisar = () => {
    setAppliedFilters({ ...formData });
  };

  const handleModalSave = async () => {
    if (!editFormData.versaoNome) {
      alert("O nome da versão é obrigatório");
      return;
    }
    try {
      if (selectedItem?.id) {
        // UPDATE
        await atualizarVersao(selectedItem.id, {
          nome_versao: editFormData.versaoNome.trim(),
          motorizacao: editFormData.motor,
          combustivel: COMBUSTIVEL_MAP[editFormData.combustivel] || 'F',
          modelo: editFormData.modeloId ? parseInt(editFormData.modeloId) : selectedItem.modelo
        });
      } else {
        // CREATE
        let marcaId = editFormData.marcaId ? parseInt(editFormData.marcaId) : 0;
        if (!marcaId && editFormData.marcaNome.trim()) {
          await criarMarca(editFormData.marcaNome.trim());
          carregarMarcas();
          await new Promise(r => setTimeout(r, 500));
          const marcasAtualizadas = useVehicleStore.getState().listaMarcas;
          const marcaExistente = marcasAtualizadas.find(m => m.nome_marca.trim().toUpperCase() === editFormData.marcaNome.trim().toUpperCase());
          if (marcaExistente) marcaId = marcaExistente.id;
        }

        if (!marcaId) throw new Error('Selecione ou informe uma marca.');

        let modeloId = editFormData.modeloId ? parseInt(editFormData.modeloId) : 0;
        if (!modeloId && editFormData.modeloNome.trim()) {
          const catIdNum = editFormData.categoriaId ? parseInt(editFormData.categoriaId) : 0;
          await criarModelo(editFormData.modeloNome.trim(), marcaId, catIdNum);
          await new Promise(r => setTimeout(r, 500));
          const res = await fetch(`/api/django/api/veiculos/modelos/?marca=${marcaId}`);
          if (res.ok) {
            const text = await res.text();
            const mData = text ? JSON.parse(text) : null;
            const modelos = Array.isArray(mData) ? mData : (mData?.results || []);
            const modeloExistente = modelos.find((m: { nome_modelo: string }) => m.nome_modelo.toLowerCase() === editFormData.modeloNome.trim().toLowerCase());
            if (modeloExistente) modeloId = modeloExistente.id;
          }
        }

        if (!modeloId) throw new Error('Informe o nome do modelo.');

        const combustivelCode = COMBUSTIVEL_MAP[editFormData.combustivel] || 'F';
        await criarVersao(editFormData.versaoNome.trim(), modeloId, editFormData.motor, combustivelCode);
      }
      carregarCatalogoCompleto();
      setShowVeiculoModal(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao salvar';
      setImportLog(prev => [...prev, `ERRO: ${msg}`]);
      console.error(error);
    }
  };

  /*
  const handleDelete = async () => {
    if (!selectedItem || !selectedItem.id) return;
    if (!confirm(`Deseja realmente excluir a versão "${selectedItem.nome_versao}"?`)) return;

    try {
      await excluirVersao(selectedItem.id);
      carregarCatalogoCompleto();
      resetFormData();
    } catch (error) {
      console.error(error);
    }
  };
  */

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    shouldAbortImport.current = false;
    setImportProgress({ current: 0, total: 0 });
    setImportLog(['Iniciando leitura do arquivo...']);
    setImportError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const ab = evt.target?.result;
          const wb = read(ab, { type: 'array' });
          const wsName = wb.SheetNames[0];
          const ws = wb.Sheets[wsName];
          const data = utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

          if (data.length === 0) {
            setImportLog(prev => [...prev, 'ERRO: Arquivo vazio ou formato inválido.']);
            setIsImporting(false);
            return;
          }

          setImportProgress({ current: 0, total: data.length });
          setImportLog(prev => [...prev, `Arquivo lido: ${data.length} linhas encontradas.`]);

          let marcasCriadas = 0;
          let modelosCriados = 0;
          let versoesCriadas = 0;
          let erros = 0;
          const cacheMarca: Record<string, number> = {};
          const cacheModelo: Record<string, number> = {};

          const cacheCategoriaId: Record<string, number> = {};
          
          const fetchAllPages = async (baseUrl: string) => {
            let results: any[] = [];
            let nextUrl: string | null = baseUrl;
            while (nextUrl) {
              const res = await fetch(nextUrl);
              if (!res.ok) break;
              const data = await res.json();
              if (data.results) {
                results = results.concat(data.results);
                if (data.next) {
                  try {
                    const urlObj = new URL(data.next);
                    nextUrl = `/api/django${urlObj.pathname}${urlObj.search}`;
                  } catch {
                    nextUrl = null;
                  }
                } else {
                  nextUrl = null;
                }
              } else if (Array.isArray(data)) {
                results = data;
                nextUrl = null;
              } else {
                nextUrl = null;
              }
            }
            return results;
          };

          const handleRowError = async (errMsg: string) => {
            erros++;
            setImportLog(prev => [...prev, errMsg]);
            const shouldProceed = await waitForUserDecision(errMsg);
            if (!shouldProceed) {
              shouldAbortImport.current = true;
            }
          };

          const resolveCategoriaId = async (catStr: string): Promise<number> => {
            const c = catStr.toUpperCase();
            let mappedName = 'Outro';
            if (c.includes('AUTOM')) mappedName = 'Carro';
            else if (c.includes('MOTO')) mappedName = 'Moto';
            else if (c.includes('CAMINH')) mappedName = 'Caminhão';
            else if (c.includes('ONIB')) mappedName = 'Ônibus';
            else if (c.includes('UTIL')) mappedName = 'Utilitário';

            if (cacheCategoriaId[mappedName]) return cacheCategoriaId[mappedName];

            const catsAtuais = useVehicleStore.getState().listaCategorias;
            let cat = catsAtuais.find(item => item.nome.toLowerCase() === mappedName.toLowerCase());
            
            if (!cat) {
              try {
                await useVehicleStore.getState().criarCategoria(mappedName);
                await new Promise(r => setTimeout(r, 300));
                const updatedCats = useVehicleStore.getState().listaCategorias;
                cat = updatedCats.find(item => item.nome.toLowerCase() === mappedName.toLowerCase());
              } catch { /* ignore */ }
            }
            
            if (cat?.id) {
              cacheCategoriaId[mappedName] = cat.id;
              return cat.id;
            }
            return 0;
          };

          const mapCombustivel = (comb: string): string => {
            const c = comb.trim().toUpperCase();
            if (c === 'G') return 'G';
            if (c === 'A') return 'A';
            if (c === 'F') return 'F';
            if (c === 'D') return 'D';
            if (c === 'E') return 'E';
            if (c === 'H') return 'H';
            if (c.includes('GASOLINA')) return 'G';
            if (c.includes('ALCOOL') || c.includes('ÁLCOOL')) return 'A';
            if (c.includes('FLEX')) return 'F';
            if (c.includes('DIESEL')) return 'D';
            if (c.includes('ELETRIC')) return 'E';
            if (c.includes('HIBRID')) return 'H';
            return 'F';
          };

          for (let i = 0; i < data.length; i++) {
            if (shouldAbortImport.current) {
              setImportLog(prev => [...prev, '--- IMPORTAÇÃO CANCELADA PELO USUÁRIO ---']);
              break;
            }
            const row = data[i];
            const linha = i + 1;
            const categoriaStr = String(row['Categoria'] || row['Tipo de Veículo'] || 'Outro');
            const categoriaId = await resolveCategoriaId(categoriaStr);
            const nomeFabricante = String(row['Fabricante'] || '').trim().toUpperCase();
            const nomeModeloRaw = (row['Modelo'] || '').toString().trim();
            const codigoFipe = (row['Cod.'] || row['Cód.'] || row['codigo_fipe'] || '').toString().trim();
            const combustivelRaw = (row['Combustivel'] || row['Combustível'] || 'F').toString().trim();

            try {
              if (!nomeFabricante || !nomeModeloRaw) {
                await handleRowError(`Linha ${linha}: Ignorado — Fabricante ou Modelo vazio.`);
                continue;
              }

              const combustivel = mapCombustivel(combustivelRaw);

              let nomeModeloBase = nomeModeloRaw;
              if (nomeModeloBase.toUpperCase().startsWith(nomeFabricante)) {
                nomeModeloBase = nomeModeloBase.slice(nomeFabricante.length).trim();
              }
              const baseAgg = nomeModeloBase.split(' ')[0] || nomeModeloBase;

              if (!baseAgg) {
                await handleRowError(`Linha ${linha}: Ignorado — nome do modelo inválido após limpeza.`);
                continue;
              }

              let marcaId = cacheMarca[nomeFabricante];
              if (!marcaId) {
                // Busca no estado MAIS ATUALIZADO do store para evitar duplicados criados no mesmo loop
                const marcasAtuais = useVehicleStore.getState().listaMarcas;
                const existingMarca = marcasAtuais.find(m => m.nome_marca.trim().toUpperCase() === nomeFabricante);
                
                if (existingMarca) {
                  marcaId = existingMarca.id;
                  cacheMarca[nomeFabricante] = marcaId;
                } else {
                  try {
                    // Agora criarMarca aceita apenas 1 argumento (o nome)
                    await criarMarca(nomeFabricante);
                    marcasCriadas++;
                    // Pequena pausa para o index do BD atualizar
                    await new Promise(r => setTimeout(r, 200));
                  } catch (e) {
                    setImportLog(prev => [...prev, `Linha ${linha}: Tentando recuperar marca existente após falha de criação...`]);
                  }

                  // Busca final (seja por sucesso ou por já existir no BD)
                  const res = await fetch(`/api/django/api/veiculos/marcas/?nome_marca=${encodeURIComponent(nomeFabricante)}`);
                  if (res.ok) {
                    const text = await res.text();
                    const mData = text ? JSON.parse(text) : null;
                    const marcas = Array.isArray(mData) ? mData : (mData?.results || []);
                    if (marcas.length > 0) {
                      marcaId = marcas[0].id;
                      cacheMarca[nomeFabricante] = marcaId;
                    }
                  }
                }
              }

              if (!marcaId) {
                await handleRowError(`Linha ${linha}: ERRO — Não foi possível criar/obter marca ${nomeFabricante}.`);
                continue;
              }

              const modeloKey = `${marcaId}_${baseAgg.toUpperCase()}`;
              let modeloId = cacheModelo[modeloKey];

              if (!modeloId) {
                const modelos = await fetchAllPages(`/api/django/api/veiculos/modelos/?marca=${marcaId}`);
                const existingModelo = modelos.find((m: { nome_modelo: string }) => m.nome_modelo.toLowerCase() === baseAgg.toLowerCase());
                if (existingModelo) {
                  modeloId = existingModelo.id;
                  cacheModelo[modeloKey] = modeloId;
                }

                if (!modeloId) {
                  try {
                    await criarModelo(baseAgg, marcaId, categoriaId);
                    modelosCriados++;
                  } catch (e) {
                    // Ignora erro de criação, pois o modelo pode ter sido criado por outra rotina em paralelo ou
                    // estar em um estado de lock temporário. A busca na próxima linha tentará confirmar a existência.
                  }
                  
                  await new Promise(r => setTimeout(r, 300));
                  const newModelos = await fetchAllPages(`/api/django/api/veiculos/modelos/?marca=${marcaId}`);
                  const createdModelo = newModelos.find((m: { nome_modelo: string }) => m.nome_modelo.toLowerCase() === baseAgg.toLowerCase());
                  if (createdModelo) {
                    modeloId = createdModelo.id;
                    cacheModelo[modeloKey] = modeloId;
                  }
                }
              }

              if (!modeloId) {
                await handleRowError(`Linha ${linha}: ERRO — Não foi possível criar/obter modelo ${baseAgg}.`);
                continue;
              }

              if (codigoFipe) {
                const resVersoes = await fetch(`/api/django/api/veiculos/versoes/?codigo_fipe=${codigoFipe}`);
                if (resVersoes.ok) {
                  const vData = await resVersoes.json();
                  const versoes = Array.isArray(vData) ? vData : (vData.results || []);
                  if (versoes.length > 0) {
                    await fetch(`/api/django/api/veiculos/versoes/${versoes[0].id}/`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        modelo: modeloId,
                        nome_versao: nomeModeloRaw,
                        combustivel,
                        ativo: true
                      })
                    });
                    versoesCriadas++;
                    setImportProgress({ current: i + 1, total: data.length });
                    continue;
                  }
                }

                const resCreate = await fetch('/api/django/api/veiculos/versoes/', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    nome_versao: nomeModeloRaw,
                    modelo: modeloId,
                    codigo_fipe: codigoFipe,
                    combustivel,
                    ativo: true
                  })
                });

                if (!resCreate.ok) {
                  const errBody = await resCreate.json();
                  throw new Error(JSON.stringify(errBody));
                }
                versoesCriadas++;
              }

              setImportProgress({ current: i + 1, total: data.length });
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Erro desconhecido';
              await handleRowError(`Linha ${linha}: ERRO — ${msg}`);
            }
          }

          setImportLog(prev => [
            ...prev,
            `Importação concluída!`,
            `Marcas criadas: ${marcasCriadas}`,
            `Modelos criados: ${modelosCriados}`,
            `Versões criadas/atualizadas: ${versoesCriadas}`,
            `Erros: ${erros}`
          ]);

          carregarCatalogoCompleto();
          carregarMarcas();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Erro ao processar arquivo';
          setImportError(msg);
          setImportLog(prev => [...prev, `ERRO FATAL: ${msg}`]);
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao ler arquivo';
      setImportError(msg);
      setImportLog(prev => [...prev, `ERRO: ${msg}`]);
      setIsImporting(false);
    }
  };




  return (
    <DefaultLayout>
      <div className="p-6 h-full flex flex-col gap-4 overflow-hidden bg-surface-950">
        
        {/* 1. Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500/10 text-primary-400 p-2 rounded-xl text-xl">📋</div>
            <div>
              <h1 className="text-xl font-bold text-surface-50">Catálogo de Veículos</h1>
              <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest mt-0.5">Gestão de Marcas, Modelos e Versões</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center justify-center w-8 h-8 bg-surface-900 border border-surface-700 rounded-xl hover:bg-surface-800 transition-all text-surface-400 hover:text-primary-400"
              title="Ver formato esperado da planilha"
            >
              ℹ️
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-surface-900 border border-surface-700 rounded-xl cursor-pointer hover:bg-surface-800 transition-all text-[10px] font-black text-surface-400 uppercase tracking-widest">
              <span>📁</span> IMPORTAR (XLSX/CSV)
              <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleImportFile} />
            </label>
            {selectedItem && (
              <button
                onClick={() => {
                  setEditFormData({
                    categoriaId: String((selectedItem as any).categoria || ''),
                    marcaId: String((selectedItem as any).marca_id || ''),
                    marcaNome: (selectedItem as any).marca_nome || '',
                    modeloId: String(selectedItem.modelo || ''),
                    modeloNome: (selectedItem as any).modelo_nome || '',
                    versaoNome: selectedItem.nome_versao || '',
                    motor: selectedItem.motorizacao || '',
                    combustivel: selectedItem.combustivel ? COMBUSTIVEL_REVERSE[selectedItem.combustivel] || '' : ''
                  });
                  setShowVeiculoModal(true);
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:bg-amber-500 transition-all flex items-center gap-2"
              >
                <span>✏️</span> EDITAR
              </button>
            )}
            <button 
              onClick={() => {
                setSelectedItem(null);
                setEditFormData({
                  categoriaId: '', marcaId: '', marcaNome: '', modeloId: '', modeloNome: '', versaoNome: '', motor: '', combustivel: ''
                });
                setShowVeiculoModal(true);
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-500/20 hover:bg-primary-500 transition-all flex items-center gap-2"
            >
              <span>+</span> NOVO CADASTRO
            </button>
          </div>
        </div>

        {/* 2. Box de Consulta e Edição */}
        <Card padding="md" className="border-surface-800 bg-surface-900/40">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="md:col-span-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest">Categoria</label>
                <button 
                  onClick={() => setShowCategoriaModal(true)}
                  className="text-primary-500 hover:text-primary-400 transition-all text-xs"
                  title="Gerenciar Categorias"
                >
                  ⚙️
                </button>
              </div>
              <select 
                value={formData.categoriaId}
                onChange={(e) => setFormData({...formData, categoriaId: e.target.value})}
                className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
              >
                <option value="">Selecione...</option>
                {listaCategorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>

            <div className="md:col-span-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest">Marca</label>
                <button 
                  onClick={() => setShowMarcaModal(true)}
                  className="text-primary-500 hover:text-primary-400 transition-all text-xs"
                  title="Gerenciar Marcas"
                >
                  ⚙️
                </button>
              </div>
              <select 
                value={formData.marcaId}
                onChange={(e) => {
                  const marca = listaMarcas.find(m => m.id === parseInt(e.target.value));
                  setFormData({...formData, marcaId: e.target.value, marcaNome: marca?.nome_marca || ''});
                }}
                className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
              >
                <option value="">Selecione...</option>
                {listaMarcas.filter(m => m.ativo).map(m => <option key={m.id} value={m.id}>{m.nome_marca}</option>)}
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1.5">Modelo</label>
              <input 
                type="text"
                placeholder="Ex: Civic"
                value={formData.modeloNome}
                onChange={(e) => setFormData({...formData, modeloNome: e.target.value})}
                className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1.5">Versão</label>
              <input 
                type="text"
                placeholder="Ex: Touring 1.5T"
                value={formData.versaoNome}
                onChange={(e) => setFormData({...formData, versaoNome: e.target.value})}
                className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1.5">Motor / Combustível</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="1.5T"
                  value={formData.motor}
                  onChange={(e) => setFormData({...formData, motor: e.target.value})}
                  className="w-1/2 bg-surface-950 border border-surface-700 rounded-lg px-2 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                />
                <select 
                  value={formData.combustivel}
                  onChange={(e) => setFormData({...formData, combustivel: e.target.value})}
                  className="w-1/2 bg-surface-950 border border-surface-700 rounded-lg px-2 py-2 text-xs text-surface-100 focus:outline-none focus:border-primary-500"
                >
                  <option value="">Todos</option>
                  <option value="Flex">Flex</option>
                  <option value="Gasolina">Gasolina</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Híbrido">Híbrido</option>
                  <option value="Elétrico">Elétrico</option>
                  <option value="Álcool">Álcool</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-1 flex items-end gap-2">
              <div className="flex-1 flex gap-2">
                <button 
                  onClick={handlePesquisar}
                  className="flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/20"
                >
                  Pesquisar
                </button>
                <button 
                  onClick={() => {
                    resetFormData();
                    setAppliedFilters(null);
                  }}
                  className="flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg bg-surface-700 hover:bg-surface-600 text-white"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* 3. Tabela de Listagem */}
        <div className="flex-1 bg-surface-900/20 rounded-2xl border border-surface-800 overflow-hidden flex flex-col relative">
          <div className="p-3 border-b border-surface-800 flex items-center justify-between bg-surface-900/50">
            <div className="relative w-72">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">🔍</span>
              <input 
                type="text" 
                placeholder="Pesquisar no catálogo..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  gridRef.current?.api.setGridOption('quickFilterText', e.target.value);
                }}
                className="w-full bg-surface-950 border border-surface-800 rounded-lg pl-9 pr-4 py-2 text-[10px] font-bold text-surface-100 focus:outline-none focus:border-primary-500/50 transition-all uppercase tracking-widest"
              />
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
              {isLoading && (
                <div className="flex items-center gap-2 text-primary-400 bg-primary-500/10 border border-primary-500/20 px-3 py-1.5 rounded-lg">
                  <span className="animate-spin inline-block text-sm">⏳</span>
                  <span>Baixando registros...</span>
                </div>
              )}
              <span className="text-surface-600">Total: {listaCatalogoFiltrada.length} itens</span>
            </div>
          </div>

          <div className="flex-1 ag-theme-alpine-dark w-full">
            <AgGridReact
              ref={gridRef}
              rowData={listaCatalogoFiltrada}
              columnDefs={columnDefs}
              pagination={true}
              paginationPageSize={50}
              rowSelection="single"
              onSelectionChanged={onSelectionChanged}
              animateRows={true}
              overlayLoadingTemplate={'<span class="ag-overlay-loading-center">Sincronizando Catálogo...</span>'}
              defaultColDef={{
                resizable: true,
                sortable: true
              }}
            />
          </div>
        </div>

        {/* 4. Import Overlay / Monitor de Processos */}
        {isImporting && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <Card className="w-full max-w-2xl bg-surface-900 border-primary-500/30 flex flex-col max-h-[90vh]">
              <div className="text-center mb-6 pt-4">
                <div className="w-16 h-16 bg-primary-600/20 text-primary-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce">🚀</div>
                <h2 className="text-lg font-bold text-white">Monitor de Importação de Catálogo</h2>
                <p className="text-surface-400 text-[10px] font-bold uppercase tracking-widest">Processando dados em background...</p>
              </div>

              <div className="px-6 mb-4">
                <div className="h-2 bg-surface-950 rounded-full overflow-hidden border border-surface-800 mb-2">
                  <div 
                    className="h-full bg-primary-500 transition-all duration-300"
                    style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                  />
                </div>
                <div className="text-center text-[10px] font-black text-surface-600 uppercase">
                  {importProgress.current} de {importProgress.total} registros ({Math.round(importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0)}%)
                </div>
              </div>

              {/* Console de Logs */}
              <div className="flex-1 px-6 mb-6 overflow-hidden flex flex-col">
                <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
                  Console de Processamento
                </h3>
                <div className="flex-1 bg-surface-950 rounded-xl border border-surface-800 p-4 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1.5">
                  {importLog.length === 0 && <p className="text-surface-700 italic">Aguardando início do log...</p>}
                  {importLog.map((log, i) => (
                    <div key={i} className={`flex gap-3 ${log.includes('ERRO') ? 'text-danger-400' : log.includes('concluída') || log.includes('SUCESSO') ? 'text-green-400' : 'text-surface-400'}`}>
                      <span className="text-surface-700 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                      <span className="break-all">{log}</span>
                    </div>
                  ))}
                  <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                </div>
              </div>

              <div className="px-6 pb-6 flex gap-3">
                {importProgress.current < importProgress.total && !shouldAbortImport.current ? (
                  <button
                    onClick={() => {
                      shouldAbortImport.current = true;
                      setImportLog(prev => [...prev, 'Solicitando cancelamento...']);
                    }}
                    className="flex-1 py-3 bg-danger-600/20 hover:bg-danger-600/30 text-danger-400 border border-danger-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Interromper Processo
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsImporting(false);
                      setImportLog([]);
                    }}
                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary-500/20"
                  >
                    Fechar e Atualizar Lista
                  </button>
                )}
              </div>
            </Card>
          </div>
        )}

        {importError && (
          <div className="fixed bottom-6 right-6 z-[110] p-4 bg-danger-500/90 backdrop-blur text-white rounded-xl shadow-2xl border border-white/20 max-w-md animate-slide-up">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-bold text-sm">Erro na Importação</p>
                <p className="text-xs opacity-90">{importError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Erro Pendente (Decisão do Usuário) */}
        {pendingError && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl overflow-hidden max-w-md w-full animate-slide-up">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-danger-500/20 flex items-center justify-center text-danger-500 text-xl">
                    ⚠️
                  </div>
                  <h3 className="text-lg font-bold text-surface-50">Atenção Necessária</h3>
                </div>
                <p className="text-sm text-surface-300 mb-6">{pendingError.message}</p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      pendingError.resolve(false);
                      setPendingError(null);
                    }}
                    className="px-4 py-2 bg-surface-800 text-surface-300 rounded-xl hover:bg-surface-700 hover:text-white transition-all text-xs font-bold uppercase"
                  >
                    Cancelar Importação
                  </button>
                  <button
                    onClick={() => {
                      pendingError.resolve(true);
                      setPendingError(null);
                    }}
                    className="px-4 py-2 bg-danger-600 text-white rounded-xl shadow-lg shadow-danger-500/20 hover:bg-danger-500 transition-all text-xs font-bold uppercase"
                  >
                    Ignorar e Prosseguir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Modal de Modelo de Importação */}
        {showTemplateModal && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] animate-slide-up">
              <div className="p-6 border-b border-surface-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-500/10 text-primary-400 p-2 rounded-xl">ℹ️</div>
                  <h2 className="text-xl font-bold text-surface-50">Modelo de Importação</h2>
                </div>
                <button 
                  onClick={() => setShowTemplateModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-800 text-surface-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar text-surface-300 text-sm space-y-4">
                <p>Para que a importação funcione corretamente, seu arquivo XLSX ou CSV deve conter a seguinte estrutura de colunas (a primeira linha deve ser o cabeçalho):</p>
                <div className="overflow-x-auto bg-surface-950 rounded-xl border border-surface-800">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-surface-900 text-surface-400">
                      <tr>
                        <th className="p-3 font-bold">Fabricante <span className="text-danger-500">*</span></th>
                        <th className="p-3 font-bold">Modelo <span className="text-danger-500">*</span></th>
                        <th className="p-3 font-bold">Categoria</th>
                        <th className="p-3 font-bold">Cód.</th>
                        <th className="p-3 font-bold">Combustivel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-800">
                      <tr>
                        <td className="p-3 text-surface-200">FIAT</td>
                        <td className="p-3 text-surface-200">Palio 1.0 Fire Flex 8V 5p</td>
                        <td className="p-3 text-surface-200">Carro</td>
                        <td className="p-3 text-surface-200">001234-5</td>
                        <td className="p-3 text-surface-200">Flex</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-surface-200">HONDA</td>
                        <td className="p-3 text-surface-200">CG 160 FAN Flex</td>
                        <td className="p-3 text-surface-200">Moto</td>
                        <td className="p-3 text-surface-200">002345-6</td>
                        <td className="p-3 text-surface-200">Gasolina</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <ul className="list-disc pl-5 space-y-2 text-xs">
                  <li><strong className="text-primary-400">Fabricante:</strong> (Obrigatório) Nome da marca (ex: VW, Chevrolet).</li>
                  <li><strong className="text-primary-400">Modelo:</strong> (Obrigatório) Nome completo do modelo/versão.</li>
                  <li><strong className="text-primary-400">Categoria:</strong> (Opcional) Tipo do veículo (ex: Carro, Moto, Caminhão). O padrão é "Outro".</li>
                  <li><strong className="text-primary-400">Cód.:</strong> (Opcional) Código identificador da FIPE.</li>
                  <li><strong className="text-primary-400">Combustivel:</strong> (Opcional) Gasolina, Diesel, Flex, etc. O padrão é Flex.</li>
                </ul>
                <div className="p-3 bg-surface-800/50 rounded-xl border border-surface-700 mt-4 text-xs italic">
                  * Nota: O sistema também consegue identificar variações sutis nos cabeçalhos como "Cod.", "Combustível" (com acento) ou "Tipo de Veículo".
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. Modais de Gestão (Marcas e Categorias) */}
        {showVeiculoModal && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <Card className="w-full max-w-2xl bg-surface-900 border-primary-500/30 flex flex-col">
              <div className="p-6 border-b border-surface-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white uppercase tracking-widest text-sm">
                  {selectedItem ? 'Editar Veículo' : 'Novo Veículo'}
                </h3>
                <button onClick={() => setShowVeiculoModal(false)} className="text-surface-500 hover:text-white">✕</button>
              </div>
              <div className="p-6 space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1.5">Categoria</label>
                    <select 
                      value={editFormData.categoriaId}
                      onChange={(e) => setEditFormData({...editFormData, categoriaId: e.target.value})}
                      className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                    >
                      <option value="">Selecione...</option>
                      {listaCategorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1.5">Marca</label>
                    <select 
                      value={editFormData.marcaId}
                      onChange={(e) => {
                        const marca = listaMarcas.find(m => m.id === parseInt(e.target.value));
                        setEditFormData({...editFormData, marcaId: e.target.value, marcaNome: marca?.nome_marca || ''});
                        if (e.target.value) {
                          selecionarMarca(Number(e.target.value));
                        }
                      }}
                      className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                    >
                      <option value="">Nova Marca...</option>
                      {listaMarcas.filter(m => m.ativo).map(m => <option key={m.id} value={m.id}>{m.nome_marca}</option>)}
                    </select>
                    {!editFormData.marcaId && (
                      <input 
                        type="text"
                        placeholder="Nome da nova marca"
                        value={editFormData.marcaNome}
                        onChange={(e) => setEditFormData({...editFormData, marcaNome: e.target.value})}
                        className="w-full mt-2 bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1.5">Modelo</label>
                    <select 
                      value={editFormData.modeloId}
                      onChange={(e) => {
                        const modelo = listaModelosFiltrados.find(m => m.id === parseInt(e.target.value));
                        setEditFormData({...editFormData, modeloId: e.target.value, modeloNome: modelo?.nome_modelo || ''});
                      }}
                      className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                      disabled={!editFormData.marcaId}
                    >
                      <option value="">Novo Modelo...</option>
                      {listaModelosFiltrados.map(m => <option key={m.id} value={m.id}>{m.nome_modelo}</option>)}
                    </select>
                    {!editFormData.modeloId && (
                      <input 
                        type="text"
                        placeholder="Nome do novo modelo"
                        value={editFormData.modeloNome}
                        onChange={(e) => setEditFormData({...editFormData, modeloNome: e.target.value})}
                        className="w-full mt-2 bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1.5">Versão</label>
                    <input 
                      type="text"
                      placeholder="Ex: Touring 1.5T"
                      value={editFormData.versaoNome}
                      onChange={(e) => setEditFormData({...editFormData, versaoNome: e.target.value})}
                      className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1.5">Motor</label>
                    <input 
                      type="text"
                      placeholder="1.5T"
                      value={editFormData.motor}
                      onChange={(e) => setEditFormData({...editFormData, motor: e.target.value})}
                      className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1.5">Combustível</label>
                    <select 
                      value={editFormData.combustivel}
                      onChange={(e) => setEditFormData({...editFormData, combustivel: e.target.value})}
                      className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                    >
                      <option value="">Selecione...</option>
                      <option value="Flex">Flex</option>
                      <option value="Gasolina">Gasolina</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Híbrido">Híbrido</option>
                      <option value="Elétrico">Elétrico</option>
                      <option value="Álcool">Álcool</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button 
                    onClick={() => setShowVeiculoModal(false)}
                    className="px-4 py-2 bg-surface-800 text-surface-300 rounded-lg text-[10px] font-black uppercase hover:bg-surface-700"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleModalSave}
                    disabled={isLoading || isSaving}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-primary-500 disabled:opacity-50"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>

              </div>
            </Card>
          </div>
        )}

        {showCategoriaModal && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <Card className="w-full max-w-md bg-surface-900 border-primary-500/30 flex flex-col">
              <div className="p-6 border-b border-surface-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white uppercase tracking-widest text-sm">Gerenciar Categorias</h3>
                <button onClick={() => setShowCategoriaModal(false)} className="text-surface-500 hover:text-white">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nova Categoria..." 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 bg-surface-950 border border-surface-800 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                  />
                  <button 
                    onClick={async () => {
                      if (newCatName.trim()) {
                        await useVehicleStore.getState().criarCategoria(newCatName.trim());
                        setNewCatName('');
                      }
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-[10px] font-black uppercase"
                  >
                    Add
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {listaCategorias.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-2 bg-surface-950 rounded-lg border border-surface-800 group">
                      <span className="text-sm text-surface-200 font-bold">{cat.nome}</span>
                      <button 
                        onClick={() => cat.id && useVehicleStore.getState().excluirCategoria(cat.id)}
                        className="text-danger-500 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {showMarcaModal && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <Card className="w-full max-w-md bg-surface-900 border-primary-500/30 flex flex-col">
              <div className="p-6 border-b border-surface-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white uppercase tracking-widest text-sm">Gerenciar Marcas</h3>
                <button onClick={() => setShowMarcaModal(false)} className="text-surface-500 hover:text-white">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nova Marca..." 
                    value={newMarcaName}
                    onChange={(e) => setNewMarcaName(e.target.value)}
                    className="flex-1 bg-surface-950 border border-surface-800 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                  />
                  <button 
                    onClick={async () => {
                      if (newMarcaName.trim()) {
                        await useVehicleStore.getState().criarMarca(newMarcaName.trim());
                        setNewMarcaName('');
                      }
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-[10px] font-black uppercase"
                  >
                    Add
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {listaMarcas.map(marca => (
                    <div key={marca.id} className="flex items-center justify-between p-2 bg-surface-950 rounded-lg border border-surface-800 group">
                      <span className="text-sm text-surface-200 font-bold">{marca.nome_marca}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => useVehicleStore.getState().atualizarStatusMarca(marca.id, !marca.ativo)}
                          className={`text-[10px] font-black px-2 py-0.5 rounded ${marca.ativo ? 'text-green-500 bg-green-500/10' : 'text-danger-500 bg-danger-500/10'}`}
                        >
                          {marca.ativo ? 'ATIVO' : 'OFF'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

      </div>
    </DefaultLayout>
  );
}
