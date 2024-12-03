import axios from 'axios';

// Configuración de Axios
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api', 
  timeout: 10000, // Tiempo máximo de espera
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;