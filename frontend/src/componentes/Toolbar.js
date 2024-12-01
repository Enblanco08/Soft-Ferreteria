import React from 'react';
import { Link } from 'react-router-dom';


function Toolbar() {
    return (
        <nav>
            <ul>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/product-input">Agregar Producto</Link></li>
                <li><Link to="/product-table">Ver Productos</Link></li>
                <li><Link to="/sale-summary">Resumen de Ventas</Link></li>
            </ul>
        </nav>
    );
}


export default Toolbar;