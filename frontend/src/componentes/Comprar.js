import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosconfig';

const Comprar = () => {
    const { state } = useLocation();
    const { productosSeleccionados } = state || { productosSeleccionados: [] };
    const [cantidades, setCantidades] = useState({});
    const navigate = useNavigate();

    const handleCantidadChange = (id, cantidad) => {
        setCantidades({ ...cantidades, [id]: cantidad });
    };

    const handleConfirmarCompra = async () => {
        const productosConCantidades = productosSeleccionados.map((producto) => ({
            id: producto.id,
            cantidad: cantidades[producto.id] || 1,
        }));

        try {
            await axiosInstance.post('/comprar', { productos: productosConCantidades });
            alert("Compra realizada con éxito.");
            navigate('/');
        } catch (error) {
            console.error("Error al realizar la compra:", error);
            alert("Error al realizar la compra.");
        }
    };

    return (
        <div>
            <h2>Confirmar Compra</h2>
            {productosSeleccionados.map((producto) => (
                <div key={producto.id}>
                    <p>{producto.nombre}</p>
                    <input
                        type="number"
                        min="1"
                        max={producto.cantidad_stock}
                        defaultValue="1"
                        onChange={(e) => handleCantidadChange(producto.id, parseInt(e.target.value, 10))}
                    />
                </div>
            ))}
            <button onClick={handleConfirmarCompra}>Confirmar Compra</button>
        </div>
    );
};

export default Comprar;