import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Importa el archivo de estilos

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Hook para redirigir

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Resetear errores previos
        try {
            const response = await axios.post('http://localhost:5000/api/login', {
                username,
                password,
            });

            console.log('Respuesta del servidor:', response.data);

            // Guardar el token en localStorage
            localStorage.setItem('token', response.data.token);

            // Redirigir a la raíz (http://localhost:3000)
            navigate('/');
        } catch (error) {
            console.error('Error en la solicitud:', error.response?.data || error.message);
            setError(error.response?.data?.error || 'Error al iniciar sesión.');
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="login-form">
                <h2>Iniciar sesión</h2>
                <input
                    className="login-input"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    className="login-input"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit" className="login-button">Iniciar sesión</button>
            </form>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default Login;