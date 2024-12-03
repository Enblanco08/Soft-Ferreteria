import React, { useState, useEffect } from 'react';
import './Home.css';

const Home = () => {
    const [productos, setProductos] = useState([]);

    // Llamada al backend para obtener los productos
    useEffect(() => {
        fetch('/api/productos') // Llamada a tu backend
            .then((response) => response.json())
            .then((data) => setProductos(data.datos))
            .catch((error) => console.error('Error al obtener los productos:', error));
    }, []);

    return (
        <div className="contenedor-principal">
            {/* Barra de opciones */}
            <div className="barra-opciones">
                <button>Login</button>
                <button>Productos</button>
                <button>Ayuda</button>
                <button>Información de Sucursales</button>
            </div>

            {/* Contenido dinámico (productos) */}
            <div className="contenido">
                <h1>Productos</h1>
                <div className="productos-grid">
                    {productos.map((producto) => (
                        <div className="producto-card" key={producto.id}>
                            <img
                                src={producto.imagen || "https://via.placeholder.com/150"}
                                alt={producto.nombre}
                                className="producto-imagen"
                            />
                            <h3>{producto.nombre}</h3>
                            <p>Precio: ${producto.precio_venta}</p>
                            <p>Stock: {producto.cantidad_stock}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
