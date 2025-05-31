const isLocalhost = window.location.hostname === 'localhost';
const API_BASE_URL = isLocalhost
  ? 'http://localhost:3000'
  : 'https://api-backend-server.onrender.com'; 

export async function apiRequest(endpoint, method = 'GET', body = null) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('authToken');

    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

   
    if (body) console.log(`[API] Body:`, body);

    const response = await fetch(url, options);
    const contentType = response.headers.get('Content-Type') || '';

    

    if (!contentType.includes('application/json')) {
      console.warn('[API] Resposta não é JSON:', await response.text());
      throw new Error('Resposta do servidor não é JSON válida');
    }

    const data = await response.json();
   
    // Se for um objeto e indicar falha, lança erro
    if (!response.ok || (typeof data === 'object' && data.success === false)) {
      const errorMsg = data.message || 'Erro desconhecido';
      console.warn(`[API] Erro de resposta: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Se tiver `data`, retorna ela. Se não, retorna o conteúdo bruto (útil para arrays)
    return data.data ?? data;

  } catch (err) {
    console.warn(`Erro ao chamar ${endpoint}:`, err.message);
    return null;
  }
}
