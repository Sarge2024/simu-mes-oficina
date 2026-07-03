const fs = require('fs');
const file = '/mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES Oficina/frontend/src/pages/admin/VeiculoCatalogoPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `                    categoriaId: String(selectedItem.categoria || ''),
                    marcaId: String(selectedItem.marca_id || ''),
                    marcaNome: selectedItem.marca_nome || '',
                    modeloId: String(selectedItem.modelo || ''),
                    modeloNome: selectedItem.modelo_nome || '',
                    versaoNome: selectedItem.nome_versao || '',
                    motor: selectedItem.motorizacao || '',
                    combustivel: COMBUSTIVEL_REVERSE[selectedItem.combustivel] || ''`,
  `                    categoriaId: String((selectedItem as any).categoria || ''),
                    marcaId: String((selectedItem as any).marca_id || ''),
                    marcaNome: (selectedItem as any).marca_nome || '',
                    modeloId: String(selectedItem.modelo || ''),
                    modeloNome: (selectedItem as any).modelo_nome || '',
                    versaoNome: selectedItem.nome_versao || '',
                    motor: selectedItem.motorizacao || '',
                    combustivel: selectedItem.combustivel ? COMBUSTIVEL_REVERSE[selectedItem.combustivel] || '' : ''`
);

fs.writeFileSync(file, content);
console.log('Patch 4 applied');
