import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './paginas/Login';
import Home from './paginas/Home'; // Importar la nueva página Home

function App() {
    return (
        <Router>
            {/* Definir las rutas */}
            <Routes>
                <Route path="/" element={<Home />} /> {/* Nueva página principal */}
                <Route path="/login" element={<Login />} />
            </Routes>
        </Router>
    );
}

export default App;