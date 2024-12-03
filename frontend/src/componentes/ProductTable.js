import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosconfig';

const ProductTable = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProductos = async () => {
    try {
      const response = await axiosInstance.get('/productos');
      
      // Verifica si la respuesta tiene la propiedad 'productos' y es un array
      if (response.data && Array.isArray(response.data.productos)) {
        setProductos(response.data.productos);
        setError(null);
      } else {
        throw new Error('Los datos no tienen el formato esperado.');
      }
    } catch (error) {
      console.error('Error al obtener productos:', error);
      setError(error.message || 'No se pudieron cargar los productos. Intenta nuevamente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  if (loading) return <p>Cargando productos...</p>;
  if (error) return <p>Error: {error}</p>;

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
            <td>{producto.precio_venta}</td>
            <td>{producto.cantidad_stock}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ProductTable;