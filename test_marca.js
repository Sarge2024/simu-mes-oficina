async function test() {
  const url = "http://127.0.0.1:5012/api/veiculos/versoes/?search=civic";
  const response = await fetch(url);
  const data = await response.json();
  const first = data.results[0];
  console.log("Keys:", Object.keys(first));
  console.log("marca_id:", first.marca_id);
}
test().catch(console.error);
