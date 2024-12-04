import axios from 'axios';

// Configuración de Axios
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api', 
  timeout: 10000, // Tiempo máximo de espera
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Error de respuesta:', error.response);
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      console.error('Error de solicitud:', error.request);
    } else {
      // Algo sucedió al configurar la solicitud
      console.error('Error de configuración:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;