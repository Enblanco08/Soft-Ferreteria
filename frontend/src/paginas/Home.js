import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosconfig';
import './Home.css';

const Home = () => {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usuario, setUsuario] = useState(null); // Estado para el usuario
    const [productosSeleccionados, setProductosSeleccionados] = useState([]); // Estado para los productos seleccionados
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && token !== 'anonimo') {
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
            setUsuario('Usuario Anónimo');
        }
    }, []);

    useEffect(() => {
        const fetchProductos = async () => {
            try {
                const response = await axiosInstance.get('/productos');
                console.log('Productos recibidos:', response.data);  // Aquí verás los datos recibidos
                setProductos(response.data.productos);
            } catch (error) {
                console.error('Error al obtener los productos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductos();
    }, []);

    const handleSeleccionarProducto = (id) => {
        const index = productosSeleccionados.indexOf(id);
        let nuevosProductosSeleccionados = [...productosSeleccionados];
        if (index > -1) {
            nuevosProductosSeleccionados.splice(index, 1);
        } else {
            nuevosProductosSeleccionados.push(id);
        }
        setProductosSeleccionados(nuevosProductosSeleccionados);
        localStorage.setItem('productosSeleccionados', JSON.stringify(nuevosProductosSeleccionados));
    };

    const handleLogout = () => {
        localStorage.removeItem('token'); // Eliminar el token
        setUsuario('Usuario Anónimo'); // Reiniciar el estado de usuario
        navigate('/'); // Redirigir al Home, no al Login
    };

    const handleIrACarrito = () => {
        // Recupera los productos seleccionados del localStorage
        const productosEnCarrito = JSON.parse(localStorage.getItem('productosSeleccionados')) || [];

        if (productosEnCarrito.length > 0) {
            navigate('/carrito');  // Redirigir al carrito
        } else {
            alert("No hay productos seleccionados.");
        }
    };

    if (loading) {
        return <p className="cargando">Cargando productos...</p>;
    }

    return (
        <div className="contenedor-principal">
            <div className="barra-opciones">
                {usuario === 'Usuario Anónimo' && (
                    <Link to="/login">
                        <button>Login</button>
                    </Link>
                )}

                {usuario === 'Usuario Anónimo' && (
                    <Link to="/registro">
                        <button>Registrar cuenta</button> {/* Botón de registrar cuenta */}
                    </Link>
                )}

                {usuario !== 'Usuario Anónimo' && (
                    <Link to="/productos">
                        <button>Productos</button>
                    </Link>
                )}

                <button onClick={() => alert("Ayuda no está disponible aún.")}>Ayuda</button>
                <button onClick={() => alert("Información de sucursales no está disponible aún.")}>Información de Sucursales</button>

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
                            <div
                                className={`producto-card ${productosSeleccionados.includes(producto.id) ? 'seleccionado' : ''}`}
                                key={producto.id}
                                onClick={() => handleSeleccionarProducto(producto.id)}
                            >
                                <img
                                    src={producto.imagen || "https://via.placeholder.com/150"}
                                    alt={producto.nombre}
                                    className="producto-imagen"
                                />
                                <div className="producto-info">
                                    <h3>{producto.nombre}</h3>
                                    <p className="producto-precio">${producto.precio_venta}</p>
                                    <p className="producto-stock">Stock: {producto.cantidad_stock}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No hay productos disponibles en este momento.</p>
                    )}
                </div>
            </div>

            {/* Botón para proceder a la compra */}
            <div className="contenedor-boton-compra">
                <button onClick={handleIrACarrito} className="boton-compra">
                    Proceder a la compra
                </button>
            </div>
        </div>
    );
};

export default Home;