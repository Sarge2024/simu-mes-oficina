async function test() {
  const marcasRes = await fetch("http://127.0.0.1:5012/api/veiculos/marcas/");
  let marcasData = await marcasRes.json();
  let allMarcas = marcasData.results;
  while(marcasData.next) {
    const r = await fetch(marcasData.next);
    marcasData = await r.json();
    allMarcas = allMarcas.concat(marcasData.results);
  }
  
  const activeMarcaIds = new Set(allMarcas.filter(m => m.ativo).map(m => m.id));
  console.log("Active marcas:", activeMarcaIds.size);

  const versoesRes = await fetch("http://127.0.0.1:5012/api/veiculos/versoes/?search=civic"); // test small subset to save time
  const versoesData = await versoesRes.json();
  const allVersoes = versoesData.results; // Civic has 290 items, fits in 1 page? Actually it's paginated, let's just use page 1

  let result = allVersoes.filter(item => activeMarcaIds.has(item.marca_id));
  console.log("After marca filter:", result.length);
  
  const appliedFilters = { categoriaId: "6" };
  result = result.filter(item => String(item.categoria) === appliedFilters.categoriaId);
  console.log("After categoria filter:", result.length);
}
test().catch(console.error);
