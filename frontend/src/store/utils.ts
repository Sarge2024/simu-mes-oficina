export const fetchAllPages = async (baseUrl: string) => {
  const res = await fetch(baseUrl);
  if (!res.ok) throw new Error('Falha na busca');
  const data = await res.json();
  let results = data.results ? [...data.results] : (Array.isArray(data) ? [...data] : []);
  
  if (data.count && data.next) {
    const totalPages = Math.ceil(data.count / 50); // Assuming standard pagination
    const cleanUrl = baseUrl.replace(/[?&]page=\d+/, '');
    const sep = cleanUrl.includes('?') ? '&' : '?';
    
    const batchSize = 15;
    for (let i = 2; i <= totalPages; i += batchSize) {
      const promises = [];
      for (let j = i; j < i + batchSize && j <= totalPages; j++) {
        promises.push(
          fetch(`${cleanUrl}${sep}page=${j}`).then(r => r.ok ? r.json() : { results: [] })
        );
      }
      const batchData = await Promise.all(promises);
      batchData.forEach(page => {
        if (page.results) results = results.concat(page.results);
      });
    }
  }
  return results;
};
