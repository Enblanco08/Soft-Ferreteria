import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './paginas/Login';
import Toolbar from './componentes/Toolbar';
import ProductInput from './componentes/ProductInput';
import ProductTable from './componentes/ProductTable';
import SaleSummary from './componentes/SaleSummary';

function App() {
    return (
        <Router>
            <Toolbar />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/product-input" element={<ProductInput />} />
                <Route path="/product-table" element={<ProductTable />} />
                <Route path="/sale-summary" element={<SaleSummary />} />
            </Routes>
        </Router>
    );
}
export default App;