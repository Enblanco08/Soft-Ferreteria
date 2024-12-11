import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './paginas/Login';
import Home from './paginas/Home';
import ProductTable from './componentes/ProductTable'; // Importar tu tabla de productos
import Carrito from './paginas/carrito'; // Nueva página para el carrito
import ProductDetails from './componentes/Productdetails'; // Usar la "d" minúscula
import FormularioPago from './paginas/FormularioPago';
import Registro from './paginas/Registro';

function App() {
    return (
        <Router>
            {/* Definir las rutas */}
            <Routes>
                <Route path="/" element={<Home />} /> {/* Página principal */}
                <Route path="/login" element={<Login />} />
                <Route path="/productos" element={<ProductTable />} /> {/* Nueva ruta para la tabla de productos */}
                <Route path="/carrito" element={<Carrito />} /> {/* Nueva ruta para la página de carrito */}
                <Route path="/registro" element={<Registro />} /> {/* Nueva ruta para la página de carrito */}
                <Route path="/formulario-tarjeta" element={<FormularioPago />} />
                <Route path="/producto/:id" element={<ProductDetails />} /> {/* Ruta para los detalles del producto */}
            </Routes>
        </Router>
    );
}

export default App;