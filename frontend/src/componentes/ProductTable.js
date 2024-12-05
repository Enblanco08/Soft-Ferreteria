import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosconfig';
import './ProductTable.css';

const ProductTable = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [newProducto, setNewProducto] = useState({
    nombre: '',
    categoria: '',
    precio_venta: '',
    cantidad_stock: '',
    tipo_producto: '',
    descripcion: '',
    estado: 'activo',
    codigo_barra: ''
  });
  
  // Estado para el nuevo producto
  const [editProducto, setEditProducto] = useState(null); // Estado para el producto en edición

  const fetchProductos = async () => {
    try {
      setError(null); // Limpia el error antes de realizar la solicitud
      const response = await axiosInstance.get('/productos');
      if (response.data && Array.isArray(response.data.productos)) {
        setProductos(response.data.productos);
      } else {
        throw new Error('Formato inesperado.');
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

  // Filtrar productos por ID
  const filteredProductos = productos.filter(producto =>
    producto.id.toString().includes(searchId)
  );

  const handleSearchChange = (event) => {
    setSearchId(event.target.value);
  };

  // Función para agregar un producto
  const handleAddProducto = async (event) => {
    event.preventDefault();
  
    // Verifica si todos los campos están completos
    const { nombre, categoria, precio_venta, cantidad_stock, tipo_producto, descripcion, codigo_barra } = newProducto;
    if (!nombre || !categoria || !precio_venta || !cantidad_stock || !tipo_producto || !descripcion || !codigo_barra) {
      setError('Por favor, complete todos los campos requeridos.');
      return;  // Evitar enviar la solicitud si algún campo está vacío
    }
  
    console.log('Datos a enviar:', newProducto);
  
    try {
      const response = await axiosInstance.post('/productos', newProducto);
      console.log('Respuesta del servidor:', response);
  
      if (response.status === 201) {
        setProductos([...productos, response.data]);
        setNewProducto({
          nombre: '',
          categoria: '',
          precio_venta: '',
          cantidad_stock: '',
          tipo_producto: '',
          descripcion: '',
          estado: 'activo',
          codigo_barra: ''
        });
        console.log('Producto agregado:', response.data);
      } else {
        throw new Error('Error al agregar el producto: respuesta no esperada.');
      }
    } catch (error) {
      console.error('Error al agregar producto:', error);
      setError('No se pudo agregar el producto. Intenta nuevamente más tarde.');
  
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);  // Aquí te dará detalles sobre el error
        console.error('Código de estado:', error.response.status);
      } else if (error.request) {
        console.error('No se recibió respuesta del servidor:', error.request);
      } else {
        console.error('Error en la configuración de la solicitud:', error.message);
      }
    }
  };

  // Función para eliminar un producto
  const handleDeleteProducto = async (id) => {
    try {
      await axiosInstance.delete(`/productos/${id}`);
      setProductos(productos.filter(producto => producto.id !== id)); // Eliminar el producto de la lista
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      setError('No se pudo eliminar el producto. Intenta nuevamente más tarde.');
    }
  };

  // Función para editar un producto
  const handleEditProducto = (producto) => {
    setEditProducto(producto); // Establecer el producto que se va a editar
  };

  // Función para actualizar un producto
  const handleUpdateProducto = async (event) => {
    event.preventDefault();
    
    // Verifica si todos los campos están completos en el formulario de edición
    const { nombre, categoria, precio_venta, cantidad_stock, tipo_producto, descripcion, codigo_barra } = editProducto;
    if (!nombre || !categoria || !precio_venta || !cantidad_stock || !tipo_producto || !descripcion || !codigo_barra) {
      setError('Por favor, complete todos los campos requeridos.');
      return; // Evitar enviar la solicitud si algún campo está vacío
    }

    try {
      const response = await axiosInstance.put(`/productos/${editProducto.id}`, editProducto);
      setProductos(productos.map(producto => producto.id === editProducto.id ? response.data : producto)); // Actualizar el producto en la lista
      setEditProducto(null); // Resetear el formulario de edición
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      setError('No se pudo actualizar el producto. Intenta nuevamente más tarde.');
    }
  };

  if (loading) return <p className="loading">Cargando productos...</p>;
  if (error) return <p className="error-message">Error: {error}</p>;

  return (
    <div>
      {/* Campo de búsqueda */}
      <input
        type="text"
        placeholder="Buscar por ID..."
        value={searchId}
        onChange={handleSearchChange}
        className="search-input"
      />

      {/* Tabla de productos */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredProductos.length > 0 ? (
            filteredProductos.map((producto) => (
              <tr key={producto.id}>
                <td>{producto.id}</td>
                <td>{producto.nombre}</td>
                <td>{producto.precio_venta}</td>
                <td>{producto.cantidad_stock}</td>
                <td>
                  {/* Botón de eliminar */}
                  <button onClick={() => handleDeleteProducto(producto.id)} className="delete-btn">Eliminar</button>
                  {/* Botón de editar */}
                  <button onClick={() => handleEditProducto(producto)} className="edit-btn">Modificar</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="no-data">No se encontraron productos con esa ID.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Formulario para agregar un nuevo producto */}
      <div className="add-product-form">
        <h3>Agregar nuevo producto</h3>
        <form onSubmit={handleAddProducto}>
          <input
            type="text"
            placeholder="Nombre"
            value={newProducto.nombre}
            onChange={(e) => setNewProducto({ ...newProducto, nombre: e.target.value })}
          />
          <input
            type="text"
            placeholder="Categoría"
            value={newProducto.categoria}
            onChange={(e) => setNewProducto({ ...newProducto, categoria: e.target.value })}
          />
          <input
            type="number"
            placeholder="Precio de venta"
            value={newProducto.precio_venta}
            onChange={(e) => setNewProducto({ ...newProducto, precio_venta: e.target.value })}
          />
          <input
            type="number"
            placeholder="Cantidad en stock"
            value={newProducto.cantidad_stock}
            onChange={(e) => setNewProducto({ ...newProducto, cantidad_stock: e.target.value })}
          />
          <input
            type="text"
            placeholder="Tipo de producto"
            value={newProducto.tipo_producto}
            onChange={(e) => setNewProducto({ ...newProducto, tipo_producto: e.target.value })}
          />
          <input
            type="text"
            placeholder="Descripción"
            value={newProducto.descripcion}
            onChange={(e) => setNewProducto({ ...newProducto, descripcion: e.target.value })}
          />
          <input
            type="text"
            placeholder="Código de barra"
            value={newProducto.codigo_barra}
            onChange={(e) => setNewProducto({ ...newProducto, codigo_barra: e.target.value })}
          />
          <button type="submit">Agregar Producto</button>
        </form>
      </div>

      {/* Formulario para editar un producto */}
      {editProducto && (
        <div className="edit-product-form">
          <h3>Editar producto</h3>
          <form onSubmit={handleUpdateProducto}>
            <input
              type="text"
              placeholder="Nombre"
              value={editProducto.nombre}
              onChange={(e) => setEditProducto({ ...editProducto, nombre: e.target.value })}
            />
            <input
              type="text"
              placeholder="Categoría"
              value={editProducto.categoria}
              onChange={(e) => setEditProducto({ ...editProducto, categoria: e.target.value })}
            />
            <input
              type="number"
              placeholder="Precio de venta"
              value={editProducto.precio_venta}
              onChange={(e) => setEditProducto({ ...editProducto, precio_venta: e.target.value })}
            />
            <input
              type="number"
              placeholder="Cantidad en stock"
              value={editProducto.cantidad_stock}
              onChange={(e) => setEditProducto({ ...editProducto, cantidad_stock: e.target.value })}
            />
            <input
              type="text"
              placeholder="Tipo de producto"
              value={editProducto.tipo_producto}
              onChange={(e) => setEditProducto({ ...editProducto, tipo_producto: e.target.value })}
            />
            <input
              type="text"
              placeholder="Descripción"
              value={editProducto.descripcion}
              onChange={(e) => setEditProducto({ ...editProducto, descripcion: e.target.value })}
            />
            <input
              type="text"
              placeholder="Código de barra"
              value={editProducto.codigo_barra}
              onChange={(e) => setEditProducto({ ...editProducto, codigo_barra: e.target.value })}
            />
            <button type="submit">Actualizar Producto</button>
            <button type="button" onClick={() => setEditProducto(null)}>Cancelar</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProductTable;