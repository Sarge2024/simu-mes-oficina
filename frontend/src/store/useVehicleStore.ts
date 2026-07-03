import { create } from 'zustand';
import { fetchAllPages } from './utils';
import { formatarPlaca, validarPlaca } from '../lib/formatters';

// --- Types ---
export interface Categoria {
  id?: number;
  nome: string;
  ativo?: boolean;
}

export interface Marca {
  id: number;
  nome_marca: string;
  ativo: boolean;
  categorias?: string[];
}

export interface Modelo {
  id: number;
  nome_modelo: string;
  marca: number; // ID da marca
  marca_nome?: string;
  categoria?: number;
  categoria_nome?: string;
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
  listaCatalogo: Versao[];
  listaClientes: Cliente[];
  listaCategorias: Categoria[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  carregarMarcas: (categoria?: string) => Promise<void>;
  carregarCatalogoCompleto: () => Promise<void>;
  carregarClientes: () => Promise<void>;
  carregarCategorias: () => Promise<void>;
  atualizarStatusMarca: (id: number, ativo: boolean) => Promise<void>;
  
  // Catalog Management
  criarMarca: (nome: string) => Promise<void>;
  criarModelo: (nome: string, marcaId: number, categoriaId: number) => Promise<void>;
  criarVersao: (nome: string, modeloId: number, motorizacao?: string, combustivel?: string) => Promise<void>;
  
  // Categoria CRUD
  criarCategoria: (nome: string) => Promise<void>;
  atualizarCategoria: (id: number, nome: string) => Promise<void>;
  excluirCategoria: (id: number) => Promise<void>;
  atualizarStatusModelo: (id: number, ativo: boolean) => Promise<void>;
  atualizarStatusVersao: (id: number, ativo: boolean) => Promise<void>;
  atualizarVersao: (id: number, dados: Partial<Versao>) => Promise<void>;
  excluirVersao: (id: number) => Promise<void>;

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
  listaCatalogo: [],
  listaClientes: [],
  listaCategorias: [],
  isLoading: false,
  isSaving: false,
  error: null,

  carregarCategorias: async () => {
    set({ isLoading: true, error: null });
    try {
      const cats = await fetchAllPages(`${API_BASE}/veiculos/categorias/`);
      set({ listaCategorias: cats, isLoading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, isLoading: false });
    }
  },

  criarCategoria: async (nome: string) => {
    set({ isSaving: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/veiculos/categorias/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, ativo: true })
      });
      if (!res.ok) throw new Error('Falha ao criar categoria');
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (data) {
        const newState = [...get().listaCategorias, data];
        set({ listaCategorias: newState, isSaving: false });
        // Recarrega para garantir sincronia total
        get().carregarCategorias();
      }
    } catch (err: any) {
      set({ error: err.message, isSaving: false });
      throw err;
    }
  },

  atualizarCategoria: async (id: number, nome: string) => {
    set({ isSaving: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/veiculos/categorias/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome })
      });
      if (!res.ok) throw new Error('Falha ao atualizar categoria');
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (data) {
        set((state) => ({ 
          listaCategorias: state.listaCategorias.map(c => c.id === id ? data : c),
          isSaving: false 
        }));
      }
    } catch (err: any) {
      set({ error: err.message, isSaving: false });
      throw err;
    }
  },

  excluirCategoria: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/veiculos/categorias/${id}/`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Falha ao excluir categoria');
      set((state) => ({ 
        listaCategorias: state.listaCategorias.filter(c => c.id !== id),
        isLoading: false 
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  // Actions

  carregarMarcas: async (categoria?: string) => {
    set({ isLoading: true, error: null });
    try {
      const url = categoria ? `${API_BASE}/veiculos/marcas/?categoria=${categoria}` : `${API_BASE}/veiculos/marcas/`;
      const marcas = await fetchAllPages(url);
      set({ listaMarcas: marcas, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  carregarCatalogoCompleto: async () => {
    set({ isLoading: true, error: null });
    try {
      const versoes = await fetchAllPages(`${API_BASE}/veiculos/versoes/?page_size=200`);
      set({ listaCatalogo: versoes, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  atualizarStatusMarca: async (id: number, ativo: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/veiculos/marcas/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo })
      });
      if (!res.ok) throw new Error('Falha ao atualizar marca');
      
      // Atualiza localmente
      set((state) => ({
        listaMarcas: state.listaMarcas.map(m => m.id === id ? { ...m, ativo } : m)
      }));
    } catch (err: any) {
      console.error(err);
    }
  },

  criarMarca: async (nome: string) => {
    set({ isSaving: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/veiculos/marcas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_marca: nome, ativo: true })
      });
      
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = null; }

      if (!res.ok) {
        throw new Error(data ? JSON.stringify(data) : 'Erro ao criar marca');
      }
      
      if (data) {
        set((state) => ({ listaMarcas: [...state.listaMarcas, data], isSaving: false }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao criar marca';
      set({ error: msg, isSaving: false });
      throw err;
    }
  },

  criarModelo: async (nome: string, marcaId: number, categoriaId: number) => {
    set({ isSaving: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/veiculos/modelos/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nome_modelo: nome, 
          marca: marcaId, 
          categoria: categoriaId, 
          ativo: true 
        })
      });

      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = null; }

      if (!res.ok) {
        throw new Error(data ? JSON.stringify(data) : 'Erro ao criar modelo');
      }

      if (data) {
        set((state) => ({ 
          listaModelosFiltrados: [...state.listaModelosFiltrados, data],
          isSaving: false
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao criar modelo';
      set({ error: msg, isSaving: false });
      throw err;
    }
  },

  criarVersao: async (nome: string, modeloId: number, motorizacao?: string, combustivel?: string) => {
    try {
      const res = await fetch(`${API_BASE}/veiculos/versoes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_versao: nome, modelo: modeloId, motorizacao, combustivel, ativo: true })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(JSON.stringify(errData));
      }
      const novaVersao = await res.json();
      set((state) => ({
        listaVersoesFiltradas: [...state.listaVersoesFiltradas, novaVersao],
        listaCatalogo: [...state.listaCatalogo, novaVersao]
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao criar versão';
      set({ error: msg });
      throw err;
    }
  },

  atualizarStatusModelo: async (id: number, ativo: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/veiculos/modelos/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo })
      });
      if (!res.ok) throw new Error('Falha ao atualizar modelo');
      set((state) => ({
        listaModelosFiltrados: state.listaModelosFiltrados.map(m => m.id === id ? { ...m, ativo } : m)
      }));
    } catch (err: any) {
      console.error(err);
    }
  },

  atualizarStatusVersao: async (id: number, ativo: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/veiculos/versoes/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo })
      });
      if (!res.ok) throw new Error('Falha ao atualizar versão');
      set((state) => ({
        listaVersoesFiltradas: state.listaVersoesFiltradas.map(v => v.id === id ? { ...v, ativo } : v),
        listaCatalogo: state.listaCatalogo.map(v => v.id === id ? { ...v, ativo } : v)
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar versão';
      set({ error: msg });
      throw err;
    }
  },

  atualizarVersao: async (id: number, dados: Partial<Versao>) => {
    set({ isSaving: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/veiculos/versoes/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      if (!res.ok) throw new Error('Falha ao atualizar versão');
      const updated = await res.json();
      set((state) => ({
        listaCatalogo: state.listaCatalogo.map(v => v.id === id ? updated : v),
        isSaving: false
      }));
    } catch (err: any) {
      set({ error: err.message, isSaving: false });
      throw err;
    }
  },

  excluirVersao: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/veiculos/versoes/${id}/`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Falha ao excluir versão');
      set((state) => ({
        listaCatalogo: state.listaCatalogo.filter(v => v.id !== id),
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  carregarClientes: async () => {
    try {
      const clientes = await fetchAllPages(`${API_BASE}/core/clientes/`);
      set({ listaClientes: clientes });
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
      const modelos = await fetchAllPages(`${API_BASE}/veiculos/modelos/?marca=${marcaId}`);
      set({ listaModelosFiltrados: modelos, isLoading: false });
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
      const versoes = await fetchAllPages(`${API_BASE}/veiculos/versoes/?modelo=${modeloId}`);
      set({ listaVersoesFiltradas: versoes, isLoading: false });
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
    const placaFormatada = formatarPlaca(placa);
    const valida = validarPlaca(placa);
    
    // Atualiza o valor formatado no estado imediatamente
    set((state) => ({
      veiculoAtual: { ...state.veiculoAtual, placa: placaFormatada },
      error: valida ? null : 'Placa em formato inválido. Use AAA-9999 (tradicional) ou AAA0A00 (Mercosul).'
    }));

    if (!valida) return;
    
    set({ isLoading: true });
    try {
      const url = `${API_BASE}/veiculos/ativos/?placa=${placaFormatada}`;
      const res = await fetch(url);
      const data = await res.json();
      const results = Array.isArray(data) ? data : (data.results || []);
      
      if (results.length > 0) {
        const veiculoEncontrado = results[0];
        
        // Se achou, temos que carregar os modelos da marca e as versões do modelo
        if (veiculoEncontrado.marca_id) {
          try {
            const modelos = await fetchAllPages(`${API_BASE}/veiculos/modelos/?marca=${veiculoEncontrado.marca_id}`);
            set({ listaModelosFiltrados: modelos });
          } catch (e) { console.error(e) }
        }
        
        if (veiculoEncontrado.modelo_id) {
          try {
            const versoes = await fetchAllPages(`${API_BASE}/veiculos/versoes/?modelo=${veiculoEncontrado.modelo_id}`);
            set({ listaVersoesFiltradas: versoes });
          } catch (e) { console.error(e) }
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
        // Se NÃO achou a placa no banco, mantemos a placa e o cliente atual digitados, mas limpamos o resto do formulário
        set((state) => ({
          veiculoAtual: {
            ...defaultVeiculo,
            placa: placaFormatada,
            cliente: state.veiculoAtual.cliente
          },
          listaModelosFiltrados: [],
          listaVersoesFiltradas: [],
          isLoading: false
        }));
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

      const placaFormatada = formatarPlaca(veiculoAtual.placa);
      const valida = validarPlaca(veiculoAtual.placa);
      if (!valida) {
        throw new Error('Placa em formato inválido. Use AAA-9999 (tradicional) ou AAA0A00 (Mercosul).');
      }

      const method = veiculoAtual.id ? 'PUT' : 'POST';
      const url = veiculoAtual.id 
        ? `${API_BASE}/veiculos/ativos/${veiculoAtual.id}/` 
        : `${API_BASE}/veiculos/ativos/`;

      const payload = {
        placa: placaFormatada,
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
