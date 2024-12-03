import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './paginas/Login';
import Home from './paginas/Home';
import ProductTable from './componentes/ProductTable'; // Importar tu tabla de productos

function App() {
    return (
        <Router>
            {/* Definir las rutas */}
            <Routes>
                <Route path="/" element={<Home />} /> {/* Página principal */}
                <Route path="/login" element={<Login />} />
                <Route path="/productos" element={<ProductTable />} /> {/* Nueva ruta para la tabla de productos */}
            </Routes>
        </Router>
    );
}

export default App;
