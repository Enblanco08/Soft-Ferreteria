import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosconfig';
import './FormularioPago.css';

const FormularioPago = () => {
  // Obtener el total desde el estado enviado a través de la navegación
  const location = useLocation();
  const navigate = useNavigate();
  const total = location.state?.total || 0; // Total de la compra (por defecto 0 si no existe)

  // Estado local para manejar los datos de la tarjeta
  const [datosTarjeta, setDatosTarjeta] = useState({
    numero: '',
    nombre: '',
    fechaExpiracion: '',
    cvv: '',
  });

  // Estado para almacenar mensajes de error
  const [error, setError] = useState(null);

  // Actualizar los datos de la tarjeta cuando el usuario escribe en los inputs
  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setDatosTarjeta((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Validar el número de tarjeta (16 dígitos)
  const validarTarjeta = (numero) => /^[0-9]{16}$/.test(numero);

  // Validar la fecha de expiración (formato MM/AA)
  const validarFechaExpiracion = (fecha) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(fecha);

  // Manejar el envío del formulario
  const manejarEnvio = async (e) => {
    e.preventDefault();

    // Validaciones de campos obligatorios
    if (!datosTarjeta.numero || !datosTarjeta.nombre || !datosTarjeta.fechaExpiracion || !datosTarjeta.cvv) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    // Validación del número de tarjeta
    if (!validarTarjeta(datosTarjeta.numero)) {
      setError('Número de tarjeta inválido. Debe tener 16 dígitos.');
      return;
    }

    // Validación de la fecha de expiración
    if (!validarFechaExpiracion(datosTarjeta.fechaExpiracion)) {
      setError('Fecha de expiración inválida. El formato debe ser MM/AA.');
      return;
    }

    // Envío de datos al backend
    try {
      await axiosInstance.post('/ventas', {
        total,
        metodo_pago: 'tarjeta', // Método de pago especificado
      });

      alert('Compra realizada con éxito.');
      navigate('/'); // Redirigir al inicio o a otra página
    } catch (error) {
      console.error('Error al procesar la compra:', error);
      setError('Hubo un problema al procesar la compra. Inténtalo nuevamente.');
    }
  };

  return (
    <div className="formulario-pago-contenedor">
      <h2>Formulario de Pago</h2>
      <form onSubmit={manejarEnvio} className="formulario-pago">
        {error && <p className="error-message">{error}</p>}

        <div className="campo">
          <label>Número de Tarjeta:</label>
          <input
            type="text"
            name="numero"
            value={datosTarjeta.numero}
            onChange={manejarCambio}
            placeholder="1234 5678 9012 3456"
            maxLength={16}
            required
          />
        </div>

        <div className="campo">
          <label>Nombre del Titular:</label>
          <input
            type="text"
            name="nombre"
            value={datosTarjeta.nombre}
            onChange={manejarCambio}
            placeholder="Nombre como aparece en la tarjeta"
            required
          />
        </div>

        <div className="campo doble">
          <div>
            <label>Fecha de Expiración:</label>
            <input
              type="text"
              name="fechaExpiracion"
              value={datosTarjeta.fechaExpiracion}
              onChange={manejarCambio}
              placeholder="MM/AA"
              maxLength={5}
              required
            />
          </div>

          <div>
            <label>CVV:</label>
            <input
              type="text"
              name="cvv"
              value={datosTarjeta.cvv}
              onChange={manejarCambio}
              placeholder="123"
              maxLength={3}
              required
            />
          </div>
        </div>

        <div className="total-pago">
          <h4>Total a Pagar: ${total}</h4>
        </div>

        <button type="submit" className="pagar-btn">
          Confirmar Pago
        </button>
      </form>
    </div>
  );
};

export default FormularioPago;
