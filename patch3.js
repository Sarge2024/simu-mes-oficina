const fs = require('fs');
const file = '/mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES Oficina/frontend/src/pages/admin/VeiculoCatalogoPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the end of the "Box de Consulta"
content = content.replace(
  /<div className="md:col-span-1 flex items-end gap-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/Card>/,
  `<div className="md:col-span-1 flex items-end gap-2">
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
        </Card>`
);

// We need to inject the VeiculoFormModal rendering right before {showCategoriaModal && (
content = content.replace(
  /\{showCategoriaModal && \(/,
  `{showVeiculoModal && (
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
                          carregarModelos(Number(e.target.value));
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

        {showCategoriaModal && (`
);

fs.writeFileSync(file, content);
console.log('Patch 3 applied');
