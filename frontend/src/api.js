import axios from 'axios';
const api = axios.create({
    baseURL: 'https://webapp-production-23b4.up.railway.app',
    headers: {
        'Content-Type': 'application/json' },
    });

export default api;