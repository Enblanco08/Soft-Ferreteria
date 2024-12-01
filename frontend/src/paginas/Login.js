import React, { useState } from 'react';
import './Login.css'; // Puedes crear un archivo CSS para estilos

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();

        // Aquí puedes implementar la lógica de autenticación
        if (username === 'admin' && password === '12345') {
            console.log('Login exitoso');
            // Redirige a la página principal o al panel de control
        } else {
            setError('Usuario o contraseña incorrectos');
        }
    };

    return (
        <div className="login-container">
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label htmlFor="username">Usuario:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Contraseña:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="error">{error}</p>}
                <button type="submit">Aceptar</button>
            </form>
        </div>
    );
};

export default Login;