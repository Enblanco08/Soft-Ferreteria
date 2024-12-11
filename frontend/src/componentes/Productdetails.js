import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../axiosconfig';
import './Productdetails.css';

const ProductDetails = () => {
  const { id } = useParams();  // Obtiene el id desde la URL
  const [producto, setProducto] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await axiosInstance.get(`/productos/${id}`);
        if (response.data) {
          setProducto(response.data);
        } else {
          setError('Producto no encontrado');
        }
      } catch (error) {
        setError('Error al obtener los detalles del producto');
      }
    };

    fetchProductDetails();
  }, [id]);

  if (error) return <p>{error}</p>;
  if (!producto) return <p>Cargando detalles...</p>;

  return (
    <div>
      <h1>{producto.nombre}</h1>
      <p>Categoria: {producto.categoria}</p>
      <p>Precio de Venta: {producto.precio_venta}</p>
      <p>Stock: {producto.cantidad_stock}</p>
      <p>Descripción: {producto.descripcion}</p>
      <p>Código de Barra: {producto.codigo_barra}</p>
    </div>
  );
};

export default ProductDetails;