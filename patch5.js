const fs = require('fs');
const file = '/mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES Oficina/frontend/src/pages/admin/VeiculoMasterPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Extract listaCategorias and carregarCategorias
content = content.replace(
  /listaMarcas, \n    listaModelosFiltrados,/,
  `listaCategorias, \n    listaMarcas, \n    listaModelosFiltrados,`
);
content = content.replace(
  /carregarMarcas, \n    carregarClientes,/,
  `carregarCategorias, \n    carregarMarcas, \n    carregarClientes,`
);

// 2. Call carregarCategorias in useEffect
content = content.replace(
  /carregarMarcas\(\);\n    carregarClientes\(\);/,
  `carregarCategorias();\n    carregarMarcas();\n    carregarClientes();`
);

// 3. Update the form layout section B
content = content.replace(
  /<div className="grid grid-cols-2 gap-5">[\s\S]*?<div>\s*<label className="block text-sm font-medium text-surface-300 mb-1\.5">\s*Cor\s*<\/label>[\s\S]*?<\/div>\s*<\/div>/,
  `<div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={categoriaAtiva}
                    onChange={(e) => setCategoriaAtiva(e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  >
                    <option value="">Todas as categorias...</option>
                    {listaCategorias.map(c => (
                      <option key={c.id} value={String(c.id)}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Marca *
                  </label>
                  <select
                    value={veiculoAtual.marcaId || ''}
                    onChange={(e) => selecionarMarca(parseInt(e.target.value))}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Selecione a marca...</option>
                    {listaMarcas.filter(m => m.ativo).map(m => (
                      <option key={m.id} value={m.id}>{m.nome_marca}</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Modelo *
                  </label>
                  <select
                    value={veiculoAtual.modeloId || ''}
                    onChange={(e) => selecionarModelo(parseInt(e.target.value))}
                    disabled={!veiculoAtual.marcaId}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">{veiculoAtual.marcaId ? 'Selecione o modelo...' : 'Selecione a marca primeiro'}</option>
                    {listaModelosFiltrados
                      .filter(m => !categoriaAtiva || String(m.categoria_veiculo) === categoriaAtiva)
                      .map(m => (
                      <option key={m.id} value={m.id}>{m.nome_modelo}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-surface-300 mb-1.5 flex justify-between">
                    <span>Versão / Motorização *</span>
                    {veiculoAtual.versao && (() => {
                      const versaoSelecionada = listaVersoesFiltradas.find(v => v.id === veiculoAtual.versao);
                      if (versaoSelecionada) {
                        return (
                          <span className="flex gap-2">
                            {versaoSelecionada.codigo_fipe && <span className="bg-surface-800 px-2 py-0.5 rounded text-xs text-primary-400 border border-surface-700">FIPE: {versaoSelecionada.codigo_fipe}</span>}
                            <span className="bg-surface-800 px-2 py-0.5 rounded text-xs text-surface-400 border border-surface-700">Combustível: {versaoSelecionada.combustivel}</span>
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </label>
                  <select
                    value={veiculoAtual.versao || ''}
                    onChange={(e) => atualizarCampoVeiculo('versao', parseInt(e.target.value))}
                    disabled={!veiculoAtual.modeloId}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">{veiculoAtual.modeloId ? 'Selecione a versão...' : 'Selecione o modelo primeiro'}</option>
                    {listaVersoesFiltradas.map(v => (
                      <option key={v.id} value={v.id}>{v.nome_versao} {v.motorizacao ? \`(\${v.motorizacao})\` : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Ano de Fabricação / Modelo
                  </label>
                  <input 
                    type="number" 
                    value={veiculoAtual.ano_fabricacao || ''}
                    onChange={(e) => atualizarCampoVeiculo('ano_fabricacao', e.target.value)}
                    placeholder="Ex: 2024"
                    min="1950"
                    max="2100"
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Cor
                  </label>
                  <input 
                    type="text" 
                    value={veiculoAtual.cor || ''}
                    onChange={(e) => atualizarCampoVeiculo('cor', e.target.value)}
                    placeholder="Ex: Branco"
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>`
);

fs.writeFileSync(file, content);
console.log('Patch 5 applied');
