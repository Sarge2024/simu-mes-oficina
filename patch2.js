const fs = require('fs');
const file = '/mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES Oficina/frontend/src/pages/admin/VeiculoCatalogoPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update header buttons
content = content.replace(
  /<button \s*onClick=\{resetFormData\}\s*className="px-4 py-2 bg-primary-600 text-white rounded-xl text-\[10px\] font-black uppercase tracking-widest shadow-lg shadow-primary-500\/20 hover:bg-primary-500 transition-all"\s*>\s*\+ Novo Cadastro\s*<\/button>/,
  `{selectedItem && (
              <button
                onClick={() => {
                  setEditFormData({
                    categoriaId: String(selectedItem.categoria || ''),
                    marcaId: String(selectedItem.marca_id || ''),
                    marcaNome: selectedItem.marca_nome || '',
                    modeloId: String(selectedItem.modelo || ''),
                    modeloNome: selectedItem.modelo_nome || '',
                    versaoNome: selectedItem.nome_versao || '',
                    motor: selectedItem.motorizacao || '',
                    combustivel: COMBUSTIVEL_REVERSE[selectedItem.combustivel] || ''
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
            </button>`
);

// We should also replace the handleSave function
content = content.replace(
  /const handleSave = async \(\) => {[\s\S]*?};\n/,
  `const handleModalSave = async () => {
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
          const res = await fetch(\`/api/django/api/veiculos/modelos/?marca=\${marcaId}\`);
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
      setImportLog(prev => [...prev, \`ERRO: \${msg}\`]);
      console.error(error);
    }
  };\n`
);

fs.writeFileSync(file, content);
console.log('Patch 2 applied');
