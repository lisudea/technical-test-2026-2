import axios from 'axios';

/*
Se crea una instancia de Axios para no escribir la URL completa en cada petición.
En local usa localhost:8080 y para despliegue toma VITE_API_URL.
*/
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080'
});

export default API;
