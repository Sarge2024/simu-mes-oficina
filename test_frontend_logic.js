async function test() {
  const url = "http://127.0.0.1:5012/api/veiculos/versoes/";
  console.log("Fetching first page...");
  const response = await fetch(url);
  const data = await response.json();
  let result = data.results;
  console.log("Total items in page 1:", result.length);
  
  const appliedFilters = { categoriaId: "6" };
  const filtered = result.filter(item => String(item.categoria) === appliedFilters.categoriaId);
  console.log("Filtered to categoria 6:", filtered.length);
  if (filtered.length > 0) {
    console.log("First matched item:", filtered[0].modelo_nome, filtered[0].marca_nome, filtered[0].categoria);
  }
}
test().catch(console.error);
