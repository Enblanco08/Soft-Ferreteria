const express = require('express');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = 'secreto'; // Reemplázalo con una clave más segura en producción

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Conexión a SQLite
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// Crear las tablas si no existen
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        categoria TEXT NOT NULL,
        precio_venta REAL NOT NULL,
        costo REAL NOT NULL,
        cantidad_stock INTEGER NOT NULL,
        tipo_producto TEXT NOT NULL,
        descripcion TEXT,
        estado TEXT DEFAULT 'activo',
        codigo_barra TEXT UNIQUE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        total REAL NOT NULL,
        metodo_pago TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS detalle_ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario REAL NOT NULL,
        FOREIGN KEY (venta_id) REFERENCES ventas (id),
        FOREIGN KEY (producto_id) REFERENCES productos (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        contraseña TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'gerente')) DEFAULT 'user'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sucursales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ubicacion TEXT NOT NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        gerente_id INTEGER NOT NULL,
        FOREIGN KEY (gerente_id) REFERENCES usuarios (id)
    )`);
});

// Ruta básica para comprobar que el backend está funcionando
app.get('/', (req, res) => {
    res.send('¡Backend funcionando!');
});

// Rutas para gestión de usuarios
app.post('/api/register', [
    body('username').isLength({ min: 3 }).withMessage('El nombre de usuario debe tener al menos 3 caracteres.'),
    body('password').isLength({ min: 5 }).withMessage('La contraseña debe tener al menos 5 caracteres.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO usuarios (username, contraseña, role) VALUES (?, ?, 'user')`, [username, hashedPassword], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Error al registrar el usuario.' });
            }
            return res.status(201).json({ message: 'Usuario registrado con éxito.' });
        });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor.' });
    }
});

// Inicio de sesión
app.post('/api/login', [
    body('username').notEmpty().withMessage('El nombre de usuario es requerido.'),
    body('password').notEmpty().withMessage('La contraseña es requerida.')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    db.get(`SELECT * FROM usuarios WHERE username = ?`, [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Error en el servidor.' });
        }
        if (!user) {
            return res.status(400).json({ error: 'Usuario no encontrado.' });
        }
        const isMatch = await bcrypt.compare(password, user.contraseña);
        if (!isMatch) {
            return res.status(400).json({ error: 'Contraseña incorrecta.' });
        }
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, message: 'Inicio de sesión exitoso.' });
    });
});

// Rutas para gestión de productos

// Obtener todos los productos
app.get('/api/productos', (req, res) => {
    db.all('SELECT * FROM productos WHERE estado = "activo"', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener los productos' });
        }
        res.json({ productos: rows });
    });
});

// Agregar un nuevo producto
app.post('/api/productos', async (req, res) => {
    const { nombre, categoria, precio_venta, costo, cantidad_stock, tipo_producto, descripcion, codigo_barra } = req.body;

    // Validar que los campos obligatorios estén presentes
    if (!nombre || !categoria || !precio_venta || !costo || !cantidad_stock || !tipo_producto) {
        return res.status(400).json({ error: 'Por favor, complete todos los campos requeridos.' });
    }

    try {
        // Inserta el nuevo producto en la base de datos
        const query = `INSERT INTO productos (nombre, categoria, precio_venta, costo, cantidad_stock, tipo_producto, descripcion, codigo_barra) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [nombre, categoria, precio_venta, costo, cantidad_stock, tipo_producto, descripcion, codigo_barra];
        db.run(query, params, function (err) {
            if (err) {
                return res.status(500).json({ error: 'Error al agregar producto.' });
            }
            res.status(201).json({ mensaje: 'Producto creado exitosamente.' });
        });
    } catch (error) {
        console.error('Error al agregar producto:', error);
        res.status(500).json({ error: 'Error al agregar producto' });
    }
});

// Actualizar un producto
app.put('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, categoria, precio_venta, cantidad_stock } = req.body;

    try {
        const query = `UPDATE productos SET nombre = ?, categoria = ?, precio_venta = ?, cantidad_stock = ? WHERE id = ?`;
        const params = [nombre, categoria, precio_venta, cantidad_stock, id];
        db.run(query, params, function (err) {
            if (err) {
                return res.status(500).json({ error: 'Error al actualizar producto' });
            }
            res.status(200).json({ message: 'Producto actualizado exitosamente' });
        });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

// Eliminar un producto
app.delete('/api/productos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        db.run('DELETE FROM productos WHERE id = ?', [id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error al eliminar producto' });
            }
            res.status(200).json({ message: 'Producto eliminado exitosamente' });
        });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});