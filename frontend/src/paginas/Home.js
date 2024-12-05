import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosconfig';
import './Home.css';

const Home = () => {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usuario, setUsuario] = useState(null); // Estado para el usuario
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && token !== 'anonimo') {
            // Si hay un token, obtener el nombre de usuario
            const fetchUsuario = async () => {
                try {
                    const response = await axiosInstance.get('/usuario', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    setUsuario(response.data.username); // Guardamos el nombre de usuario
                } catch (error) {
                    console.error('Error al obtener usuario:', error);
                    setUsuario(null);
                }
            };
            fetchUsuario();
        } else {
            // Si no hay token o el token es 'anonimo', asignamos el acceso como anónimo
            setUsuario('Usuario Anónimo');
        }
    }, []);

    useEffect(() => {
        const fetchProductos = async () => {
            try {
                const response = await axiosInstance.get('/productos');
                setProductos(response.data.productos);
            } catch (error) {
                console.error('Error al obtener los productos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductos();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token'); // Eliminar el token
        setUsuario('Usuario Anónimo'); // Reiniciar el estado de usuario
        navigate('/'); // Redirigir al Home, no al Login
    };

    if (loading) {
        return <p className="cargando">Cargando productos...</p>;
    }

    return (
        <div className="contenedor-principal">
            <div className="barra-opciones">
                {/* Siempre mostrar el botón de login si el usuario está anónimo */}
                {usuario === 'Usuario Anónimo' && (
                    <Link to="/login">
                        <button>Login</button>
                    </Link>
                )}

                {/* Mostrar productos solo si no es anónimo */}
                {usuario !== 'Usuario Anónimo' && (
                    <Link to="/productos">
                        <button>Productos</button>
                    </Link>
                )}

                <button onClick={() => alert("Ayuda no está disponible aún.")}>Ayuda</button>
                <button onClick={() => alert("Información de sucursales no está disponible aún.")}>Información de Sucursales</button>

                {/* Mostrar el botón de "Cerrar sesión" solo si el usuario está autenticado */}
                {usuario !== 'Usuario Anónimo' && (
                    <div className="usuario-info">
                        <p> {usuario}</p>
                        <button onClick={handleLogout}>Cerrar sesión</button>
                    </div>
                )}
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