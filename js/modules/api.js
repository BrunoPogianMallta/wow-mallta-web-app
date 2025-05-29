const API_BASE_URL = 'https://api-backend-server.onrender.com';

export async function apiRequest(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const contentType = response.headers.get('Content-Type') || '';
        if (!contentType.includes('application/json')) {
            throw new Error('Resposta não é JSON');
        }

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Erro desconhecido');
        }

        return data.data;
    } catch (err) {
        console.warn(`Erro ao chamar ${endpoint}:`, err.message);
        return null;
    }
}
