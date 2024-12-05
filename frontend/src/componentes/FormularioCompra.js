import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FormularioCompra = () => {
    const [productos, setProductos] = useState([]);
    const [productosSeleccionados, setProductosSeleccionados] = useState([]);
    const [metodoPago, setMetodoPago] = useState('');
    const [mensaje, setMensaje] = useState('');

    // Cargar los productos disponibles
    useEffect(() => {
        const fetchProductos = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/productos');
                setProductos(response.data.productos);
            } catch (error) {
                console.error('Error al cargar los productos:', error);
            }
        };

        fetchProductos();
    }, []);

    // Manejar el cambio en la cantidad de un producto
    const handleCantidadChange = (id, cantidad) => {
        const productoExistente = productosSeleccionados.find(p => p.id === id);
        if (productoExistente) {
            setProductosSeleccionados(productosSeleccionados.map(p =>
                p.id === id ? { ...p, cantidad } : p
            ));
        } else {
            setProductosSeleccionados([...productosSeleccionados, { id, cantidad }]);
        }
    };

    // Manejar el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!metodoPago) {
            setMensaje('Selecciona un método de pago.');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/compras', {
                productos: productosSeleccionados,
                metodo_pago: metodoPago
            });

            setMensaje(`Compra realizada con éxito. ID de la venta: ${response.data.ventaId}`);
            setProductosSeleccionados([]);
            setMetodoPago('');
        } catch (error) {
            console.error('Error al realizar la compra:', error);
            setMensaje('Error al realizar la compra. Verifica los datos e intenta de nuevo.');
        }
    };

    return (
        <div>
            <h2>Formulario de Compra</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <h3>Productos</h3>
                    {productos.map(producto => (
                        <div key={producto.id}>
                            <label>
                                {producto.nombre} (Stock: {producto.cantidad_stock}) - ${producto.precio_venta}
                                <input
                                    type="number"
                                    min="0"
                                    max={producto.cantidad_stock}
                                    placeholder="Cantidad"
                                    onChange={(e) => handleCantidadChange(producto.id, parseInt(e.target.value))}
                                />
                            </label>
                        </div>
                    ))}
                </div>

                <div>
                    <h3>Método de Pago</h3>
                    <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                        <option value="">Selecciona un método</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta</option>
                    </select>
                </div>

                <button type="submit">Realizar Compra</button>
            </form>
            {mensaje && <p>{mensaje}</p>}
        </div>
    );
};

export default FormularioCompra;