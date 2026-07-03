fetch("http://localhost:5002/api/veiculos/versoes/")
  .then(res => res.json())
  .then(data => console.log(data.results[0]))
  .catch(console.error);
