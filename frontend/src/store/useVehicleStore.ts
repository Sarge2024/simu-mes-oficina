import { create } from 'zustand';

// --- Types ---
export interface Marca {
  id: number;
  nome_marca: string;
  ativo: boolean;
}

export interface Modelo {
  id: number;
  nome_modelo: string;
  marca: number; // ID da marca
  marca_nome?: string;
  categoria_veiculo: string;
  ativo: boolean;
}

export interface Cliente {
  id: number;
  nome_razao: string;
  cpf_cnpj: string;
  limite_credito: string;
  categoria_contrato: string;
}

export interface Versao {
  id: number;
  nome_versao: string;
  codigo_fipe: string | null;
  motorizacao: string;
  combustivel: string;
  modelo: number; // ID do Modelo
  ativo: boolean;
}

export interface Veiculo {
  id?: number;
  placa: string;
  chassi: string;
  cliente: number | null; // ID do Cliente
  cliente_nome?: string;
  versao: number | null; // ID da Versão
  versao_nome?: string;
  modeloId: number | null; // Auxiliar pro form
  marcaId: number | null; // Auxiliar pro form
  ano_fabricacao: number | string;
  cor: string;
  km: number | string;
  ativo?: boolean;
}

interface VehicleStoreState {
  veiculoAtual: Veiculo;
  listaMarcas: Marca[];
  listaModelosFiltrados: Modelo[];
  listaVersoesFiltradas: Versao[];
  listaClientes: Cliente[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  carregarMarcas: () => Promise<void>;
  carregarClientes: () => Promise<void>;
  selecionarMarca: (marcaId: number) => Promise<void>;
  selecionarModelo: (modeloId: number) => Promise<void>;
  atualizarCampoVeiculo: (campo: keyof Veiculo, valor: any) => void;
  buscarVeiculoPorPlaca: (placa: string) => Promise<void>;
  salvarVeiculo: () => Promise<void>;
  resetForm: () => void;
}

const defaultVeiculo: Veiculo = {
  placa: '',
  chassi: '',
  cliente: null,
  versao: null,
  modeloId: null,
  marcaId: null,
  ano_fabricacao: '',
  cor: '',
  km: ''
};

const API_BASE = '/api/django/api';

export const useVehicleStore = create<VehicleStoreState>((set, get) => ({
  veiculoAtual: { ...defaultVeiculo },
  listaMarcas: [],
  listaModelosFiltrados: [],
  listaVersoesFiltradas: [],
  listaClientes: [],
  isLoading: false,
  isSaving: false,
  error: null,

  carregarMarcas: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/veiculos/marcas/`);
      if (!res.ok) throw new Error('Falha ao carregar marcas');
      const data = await res.json();
      set({ listaMarcas: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  carregarClientes: async () => {
    try {
      const res = await fetch(`${API_BASE}/core/clientes/`);
      if (!res.ok) throw new Error('Falha ao carregar clientes');
      const data = await res.json();
      set({ listaClientes: data });
    } catch (err: any) {
      console.error(err);
    }
  },

  selecionarMarca: async (marcaId: number) => {
    // Atualiza marca e reseta o modelo e versao selecionado
    set((state) => ({
      veiculoAtual: { ...state.veiculoAtual, marcaId, modeloId: null, versao: null },
      listaModelosFiltrados: [],
      listaVersoesFiltradas: [],
      isLoading: true
    }));

    try {
      const res = await fetch(`${API_BASE}/veiculos/modelos/?marca=${marcaId}`);
      if (!res.ok) throw new Error('Falha ao buscar modelos');
      const data = await res.json();
      set({ listaModelosFiltrados: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  selecionarModelo: async (modeloId: number) => {
    // Atualiza modelo e reseta a versao selecionada
    set((state) => ({
      veiculoAtual: { ...state.veiculoAtual, modeloId, versao: null },
      listaVersoesFiltradas: [],
      isLoading: true
    }));

    try {
      const res = await fetch(`${API_BASE}/veiculos/versoes/?modelo=${modeloId}`);
      if (!res.ok) throw new Error('Falha ao buscar versões');
      const data = await res.json();
      set({ listaVersoesFiltradas: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  atualizarCampoVeiculo: (campo: keyof Veiculo, valor: any) => {
    set((state) => {
      const newState = {
        veiculoAtual: { ...state.veiculoAtual, [campo]: valor }
      };

      // Se atualizar a placa, formata pra uppercase
      if (campo === 'placa') {
        newState.veiculoAtual.placa = (valor as string).toUpperCase();
      }
      
      // Se atualizar o chassi, limita a 17 chars e uppercase
      if (campo === 'chassi') {
        newState.veiculoAtual.chassi = (valor as string).toUpperCase().slice(0, 17);
      }

      return newState;
    });
  },

  buscarVeiculoPorPlaca: async (placa: string) => {
    if (placa.length < 7) return;
    
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/veiculos/ativos/?placa=${placa}`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        const veiculoEncontrado = data[0];
        
        // Se achou, temos que carregar os modelos da marca e as versões do modelo
        if (veiculoEncontrado.marca_id) {
            const modelosRes = await fetch(`${API_BASE}/veiculos/modelos/?marca=${veiculoEncontrado.marca_id}`);
            const modelosData = await modelosRes.json();
            set({ listaModelosFiltrados: modelosData });
        }
        
        if (veiculoEncontrado.modelo_id) {
            const versoesRes = await fetch(`${API_BASE}/veiculos/versoes/?modelo=${veiculoEncontrado.modelo_id}`);
            const versoesData = await versoesRes.json();
            set({ listaVersoesFiltradas: versoesData });
        }
        
        set({ 
            veiculoAtual: { 
                ...veiculoEncontrado, 
                marcaId: veiculoEncontrado.marca_id,
                modeloId: veiculoEncontrado.modelo_id
            }, 
            isLoading: false 
        });
      } else {
        set({ isLoading: false }); // Não achou, segue pra cadastro novo
      }
    } catch (err: any) {
      set({ isLoading: false });
    }
  },

  salvarVeiculo: async () => {
    const { veiculoAtual } = get();
    set({ isSaving: true, error: null });

    try {
      // Validations
      if (!veiculoAtual.placa || !veiculoAtual.chassi || !veiculoAtual.cliente || !veiculoAtual.versao) {
        throw new Error('Preencha os campos obrigatórios (Placa, Chassi, Cliente e Versão).');
      }

      const method = veiculoAtual.id ? 'PUT' : 'POST';
      const url = veiculoAtual.id 
        ? `${API_BASE}/veiculos/ativos/${veiculoAtual.id}/` 
        : `${API_BASE}/veiculos/ativos/`;

      const payload = {
        placa: veiculoAtual.placa,
        chassi: veiculoAtual.chassi,
        cliente: veiculoAtual.cliente,
        versao: veiculoAtual.versao,
        ano_fabricacao: veiculoAtual.ano_fabricacao || null,
        cor: veiculoAtual.cor,
        km: veiculoAtual.km || 0,
        ativo: true
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(JSON.stringify(errData));
      }

      const savedData = await res.json();
      set({ 
        veiculoAtual: { 
          ...savedData, 
          marcaId: veiculoAtual.marcaId,
          modeloId: veiculoAtual.modeloId
        }, 
        isSaving: false 
      });
      alert('Veículo salvo com sucesso!');
      
    } catch (err: any) {
      set({ error: err.message, isSaving: false });
    }
  },

  resetForm: () => {
    set({ 
      veiculoAtual: { ...defaultVeiculo }, 
      listaModelosFiltrados: [],
      listaVersoesFiltradas: [],
      error: null 
    });
  }
}));
