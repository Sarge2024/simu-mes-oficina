const fs = require('fs');
const file = '/mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES Oficina/frontend/src/pages/admin/VeiculoCatalogoPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add showVeiculoModal and editFormData
content = content.replace(
  `const [selectedItem, setSelectedItem] = useState<Partial<Versao> | null>(null);`,
  `const [selectedItem, setSelectedItem] = useState<Partial<Versao> | null>(null);
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
  });`
);

// Update onSelectionChanged to just set selectedItem
content = content.replace(
  /const onSelectionChanged = \(event: SelectionChangedEvent\) => {[\s\S]*?}\s*};\s*/,
  `const onSelectionChanged = (event: SelectionChangedEvent) => {
    const selectedRows = event.api.getSelectedRows();
    if (selectedRows.length > 0) {
      setSelectedItem(selectedRows[0]);
    } else {
      setSelectedItem(null);
    }
  };\n\n`
);

fs.writeFileSync(file, content);
console.log('Patch 1 applied');
