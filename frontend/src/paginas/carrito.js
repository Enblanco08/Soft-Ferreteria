import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Para redirigir al formulario de tarjeta
import axiosInstance from '../axiosconfig'; // Asegúrate de tener tu configuración de Axios
import './Carrito.css';

const Carrito = () => {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [error, setError] = useState(null);
  const [metodoPago, setMetodoPago] = useState(''); // Método de pago seleccionado
  const navigate = useNavigate();

  const fetchProductos = async () => {
    try {
      const response = await axiosInstance.get('/productos');
      if (response.data && Array.isArray(response.data.productos)) {
        setProductos(response.data.productos);
      } else {
        throw new Error('Formato inesperado.');
      }
    } catch (error) {
      console.error('Error al obtener productos:', error);
      setError('No se pudieron cargar los productos. Intenta nuevamente más tarde.');
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const agregarAlCarrito = (producto) => {
    setCarrito((prevCarrito) => {
      const productoExistente = prevCarrito.find((item) => item.id === producto.id);
      if (productoExistente) {
        return prevCarrito.map((item) =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      } else {
        return [...prevCarrito, { ...producto, cantidad: 1 }];
      }
    });
  };

  const eliminarDelCarrito = (id) => {
    setCarrito((prevCarrito) => prevCarrito.filter((item) => item.id !== id));
  };

  const actualizarCantidad = (id, cantidad) => {
    setCarrito((prevCarrito) =>
      prevCarrito.map((item) =>
        item.id === id ? { ...item, cantidad: cantidad } : item
      )
    );
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + item.precio_venta * item.cantidad, 0);
  };

  const finalizarCompra = () => {
    if (metodoPago === 'efectivo') {
      // Procesar compra con efectivo
      const total = calcularTotal();
      axiosInstance
        .post('/ventas', { total, metodo_pago: 'efectivo' })
        .then(() => alert('Compra realizada con éxito'))
        .catch((error) => alert('Error al procesar la compra: ' + error.message));
    } else if (metodoPago === 'tarjeta') {
      // Redirigir al formulario de tarjeta
      navigate('/formulario-tarjeta', { state: { total: calcularTotal() } });
    } else {
      alert('Por favor, selecciona un método de pago.');
    }
  };

  if (error) return <p className="error-message">Error: {error}</p>;

  return (
    <div>
      <h2>Carrito de Compras</h2>
      <div className="productos">
        <h3>Productos Disponibles</h3>
        <div className="producto-lista">
          {productos.map((producto) => (
            <div key={producto.id} className="producto">
              <h4>{producto.nombre}</h4>
              <p>{producto.descripcion}</p>
              <p>Precio: {producto.precio_venta}</p>
              <button onClick={() => agregarAlCarrito(producto)}>Agregar al carrito</button>
            </div>
          ))}
        </div>
      </div>
      <div className="carrito">
        <h3>Productos en el Carrito</h3>
        {carrito.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {carrito.map((item) => (
                <tr key={item.id}>
                  <td>{item.nombre}</td>
                  <td>
                    <input
                      type="number"
                      value={item.cantidad}
                      min="1"
                      onChange={(e) => actualizarCantidad(item.id, Number(e.target.value))}
                    />
                  </td>
                  <td>{item.precio_venta}</td>
                  <td>{item.precio_venta * item.cantidad}</td>
                  <td>
                    <button onClick={() => eliminarDelCarrito(item.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay productos en el carrito.</p>
        )}
        <div className="total">
          <h4>Total: ${calcularTotal()}</h4>
        </div>
        <div className="carrito-pago">
          <label>Método de Pago:</label>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
          >
            <option value="">Seleccionar</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
          </select>
        </div>
        <button onClick={finalizarCompra} className="comprar-btn">
          Finalizar Compra
        </button>
      </div>
    </div>
  );
};

export default Carrito;