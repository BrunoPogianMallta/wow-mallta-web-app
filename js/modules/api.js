const API_BASE_URL = 'https://api-backend-server.onrender.com';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const CACHE_PREFIX = 'cache:';
const pendingRequests = new Map();

// Funções de cache (melhoradas mas com mesma interface)
function getCacheKey(url) {
  return `${CACHE_PREFIX}${url}`;
}

function getFromCache(url) {
  const key = getCacheKey(url);
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const { data, timestamp } = JSON.parse(item);
    return Date.now() - timestamp > CACHE_TTL_MS ? null : data;
  } catch (e) {
    localStorage.removeItem(key);
    return null;
  }
}

function setCache(url, data) {
  const key = getCacheKey(url);
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (err) {
    // Limpa cache antigo se storage estiver cheio
    Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX))
      .slice(0, 5) // Limpa só os 5 mais antigos
      .forEach(k => localStorage.removeItem(k));
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  }
}

// SUA FUNÇÃO ORIGINAL MELHORADA (mas com mesma interface)
export async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const isGet = method.toUpperCase() === 'GET';
  const token = localStorage.getItem('authToken');

  // Cache para GET (otimizado)
  if (isGet) {
    const cached = getFromCache(url);
    if (cached) return Promise.resolve(cached);
    
    if (pendingRequests.has(url)) {
      return pendingRequests.get(url);
    }
  }

  // Configuração da requisição (mais robusta)
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const options = {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) })
  };

  const requestPromise = fetch(url, options)
    .then(async response => {
      if (!response.ok) {
        const error = new Error(response.statusText);
        error.response = response;
        throw error;
      }
      
      const data = await response.json();
      return data.data ?? data;
    })
    .then(data => {
      if (isGet) setCache(url, data);
      return data;
    })
    .catch(error => {
      console.error(`[API] ${method} ${endpoint} falhou:`, error.message);
      throw error; // Mantém o erro para ser tratado pelo chamador
    })
    .finally(() => {
      if (isGet) pendingRequests.delete(url);
    });

  if (isGet) pendingRequests.set(url, requestPromise);
  return requestPromise;
}