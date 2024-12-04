import React, { useState, useEffect } from 'react'; 
import { Link } from 'react-router-dom'; 
import axiosInstance from '../axiosconfig'; 
import './Home.css';

const Home = () => {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    const fetchProductos = async () => {
        try {
            const response = await axiosInstance.get('/productos'); // Esta es la URL de tu API
            console.log("Respuesta del servidor:", response.data); // Esta línea es para ver la respuesta
            setProductos(response.data.productos); // Esto asigna los productos a tu estado
        } catch (error) {
            console.error('Error al obtener los productos:', error);
        } finally {
            setLoading(false); // Deja de mostrar "Cargando productos..."
        }
    };

    fetchProductos();
}, []);

    if (loading) {
        return <p className="cargando">Cargando productos...</p>;
    }

    return (
        <div className="contenedor-principal">
            <div className="barra-opciones">
                <Link to="/login"><button>Login</button></Link>
                <Link to="/productos"><button>Productos</button></Link>
                <button onClick={() => alert("Ayuda no está disponible aún.")}>Ayuda</button>
                <button onClick={() => alert("Información de sucursales no está disponible aún.")}>Información de Sucursales</button>
            </div>

            <div className="contenido">
                <h1>Productos</h1>
                <div className="productos-grid">
                    {productos.length > 0 ? (
                        productos.map((producto) => (
                            <div className="producto-card" key={producto.id}>
                                <img
                                    src={producto.imagen || "https://via.placeholder.com/150"}
                                    alt={producto.nombre}
                                    className="producto-imagen"
                                />
                                <div className="producto-info">
                                    <h3>{producto.nombre}</h3>
                                    <p className="producto-precio">${producto.precio_venta}</p>
                                    <p className="producto-stock">Stock: {producto.cantidad_stock}</p>
                                    <button className="producto-boton">Comprar</button>
                                </div>
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