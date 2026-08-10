import axios from 'axios';

// Creo una instancia de axios con la URL base del backend hecho en FastAPI
const api = axios.create({
    baseURL: 'http://localhost:8000', 
    headers: {
        'Content-Type': 'application/json',
    }
});

export default api;