import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Para navegación
import axiosInstance from '../axiosconfig'; // Asegúrate de que axios esté configurado
import './Home.css';

const Home = () => {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Llamada al backend para obtener los productos
    useEffect(() => {
        const fetchProductos = async () => {
            try {
                const response = await axiosInstance.get('/api/productos'); // Llamada al backend
                setProductos(response.data.datos); // Asume que el backend devuelve un objeto con { datos: [...] }
            } catch (error) {
                console.error('Error al obtener los productos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductos();
    }, []);

    if (loading) {
        return <p>Cargando productos...</p>;
    }

    return (
        <div className="contenedor-principal">
            {/* Barra de opciones */}
            <div className="barra-opciones">
                <Link to="/login">
                    <button>Login</button>
                </Link>
                <Link to="/productos">
                    <button>Productos</button>
                </Link>
                <button onClick={() => alert("Ayuda no está disponible aún.")}>Ayuda</button>
                <button onClick={() => alert("Información de sucursales no está disponible aún.")}>
                    Información de Sucursales
                </button>
            </div>

            {/* Contenido dinámico (productos) */}
            <div className="contenido">
                <h1>Productos</h1>
                <div className="productos-grid">
                    {productos.length > 0 ? (
                        productos.map((producto) => (
                            <div className="producto-card" key={producto.id}>
                                <img
                                    src={producto.imagen || "https://via.placeholder.com/150"} // Si tienes imágenes en tu base de datos, ajusta aquí
                                    alt={producto.nombre}
                                    className="producto-imagen"
                                />
                                <h3>{producto.nombre}</h3>
                                <p>Precio: ${producto.precio_venta}</p>
                                <p>Stock: {producto.cantidad_stock}</p>
                            </div>
                        ))
                    ) : (
                        <p>No hay productos disponibles en este momento.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
