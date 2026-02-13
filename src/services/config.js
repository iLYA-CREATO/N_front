// Базовый URL для API и статических файлов
export const BASE_URL = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:5000';

export const API_URL = `${BASE_URL}/api`;
export const UPLOADS_URL = `${BASE_URL}/uploads`;
