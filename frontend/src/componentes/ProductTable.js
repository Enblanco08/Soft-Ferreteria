import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosconfig';



const ProductTable = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Estado para manejar errores

  // Función para obtener productos del backend
  const fetchProductos = async () => {
    try {
      const response = await axiosInstance.get('/productos'); // Ruta desde tu backend
      setProductos(response.data); // Asume que el backend devuelve un array de productos
      setError(null); // Reinicia el estado de error en caso de éxito
    } catch (error) {
      console.error('Error al obtener los productos:', error);
      setError(
        error.response?.data?.message || 'Hubo un problema al obtener los productos.'
      ); // Muestra el mensaje del backend o un mensaje genérico
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  if (loading) {
    return <p>Cargando productos...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Precio</th>
          <th>Stock</th>
        </tr>
      </thead>
      <tbody>
        {productos.map((producto) => (
          <tr key={producto.id}>
            <td>{producto.id}</td>
            <td>{producto.nombre}</td>
            <td>{producto.precio}</td>
            <td>{producto.stock}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ProductTable;