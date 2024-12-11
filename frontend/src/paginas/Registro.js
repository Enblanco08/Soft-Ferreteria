import React, { useState } from 'react';
import axios from 'axios';
import './Registro.css'; // Si tienes un archivo CSS para estilizar la página

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessages, setErrorMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Manejo de cambios en los inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'username') setUsername(value);
        if (name === 'password') setPassword(value);
    };
    console.log('Username:', username);
    console.log('Password:', password);

    // Manejo del envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessages([]);
        setSuccessMessage('');

        try {
            // Modificado para incluir la URL completa del backend
            const response = await axios.post('http://localhost:5000/api/register', { username, password });

            if (response.status === 201) {
                setSuccessMessage('Usuario registrado con éxito.');
            }
        } catch (error) {
            if (error.response && error.response.data.errors) {
                setErrorMessages(error.response.data.errors);
            } else {
                setErrorMessages([{ msg: 'Error al registrar el usuario. Intenta nuevamente.' }]);
            }
        }
        setIsLoading(false);
    };

    return (
        <div className="register-container">
            <h1>Registro de Usuario</h1>
            {successMessage && <p className="success-message">{successMessage}</p>}
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="username">Nombre de usuario</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={username}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="password">Contraseña</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <button type="submit" className="submit-button" disabled={isLoading}>
                    {isLoading ? 'Registrando...' : 'Registrar'}
                </button>
            </form>

            {errorMessages.length > 0 && (
                <div className="error-messages">
                    {errorMessages.map((error, index) => (
                        <p key={index} className="error-message">{error.msg}</p>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Register;