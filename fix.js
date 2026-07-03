const fs = require('fs');
const file = '/mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES Oficina/frontend/src/pages/admin/VeiculoMasterPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix imports
content = content.replace(
  `import { useEffect } from 'react';`,
  `import { useEffect, useState } from 'react';\nimport { formatCPFCNPJ } from '../../lib/formatters';\nimport Card from '../../components/shared/Card';`
);

// 2. Add listaVersoesFiltradas to destructuring
content = content.replace(
  `    listaModelosFiltrados, \n    listaClientes,`,
  `    listaModelosFiltrados, \n    listaVersoesFiltradas, \n    listaClientes,`
);

// 3. Add categoriaAtiva state
content = content.replace(
  `  useEffect(() => {`,
  `  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('');\n\n  useEffect(() => {`
);

fs.writeFileSync(file, content);
console.log('Fix applied');
