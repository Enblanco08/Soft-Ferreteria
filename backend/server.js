const express = require('express');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware para manejar solicitudes JSON
app.use(express.json());

// Conexión a la base de datos SQLite
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// Crear las tablas en la base de datos si no existen
db.serialize(() => {
    // Tabla de productos
    db.run(`CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        categoria TEXT NOT NULL,
        precio_venta REAL NOT NULL,
        costo REAL NOT NULL,
        cantidad_stock INTEGER NOT NULL,
        tipo_producto TEXT NOT NULL,
        descripcion TEXT,
        estado TEXT DEFAULT 'activo',  -- Nueva columna
        codigo_barra TEXT UNIQUE  -- Campo para el código de barras
    )`);

    // Tabla de ventas
    db.run(`CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        total REAL NOT NULL,
        metodo_pago TEXT NOT NULL
    )`);

    // Tabla de detalle de ventas
    db.run(`CREATE TABLE IF NOT EXISTS detalle_ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario REAL NOT NULL,
        FOREIGN KEY (venta_id) REFERENCES ventas (id),
        FOREIGN KEY (producto_id) REFERENCES productos (id)
    )`);

    // Tabla de usuarios
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        contraseña TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'gerente')) DEFAULT 'user'
    )`);

    // Tabla de sucursales
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


// Ruta para registrar un nuevo usuario
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
        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar el usuario en la base de datos
        db.run(`INSERT INTO usuarios (username, contraseña, role) VALUES (?, ?, 'user')`, [username, hashedPassword], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error al registrar el usuario.' });
            }
            return res.status(201).json({ message: 'Usuario registrado con éxito.' });
        });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor.' });
    }
});

// Ruta para iniciar sesión
app.post('/api/login', [
    body('username').notEmpty().withMessage('El nombre de usuario es requerido.'),
    body('password').notEmpty().withMessage('La contraseña es requerida.')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Verificar si el usuario existe
    db.get(`SELECT * FROM usuarios WHERE username = ?`, [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Error en el servidor.' });
        }

        if (!user) {
            return res.status(400).json({ error: 'Usuario no encontrado.' });
        }

        // Comparar la contraseña
        const isMatch = await bcrypt.compare(password, user.contraseña);
        if (!isMatch) {
            return res.status(400).json({ error: 'Contraseña incorrecta.' });
        }

        // Crear un token JWT
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, 'secreto', { expiresIn: '1h' });

        res.json({ token, message: 'Inicio de sesión exitoso.' });
    });
});


// Middleware para verificar el token JWT
function authMiddleware(req, res, next) {
    const authHeader = req.header('Authorization');

    // Verificar que el encabezado contenga el esquema 'Bearer'
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso denegado, se requiere un token válido.' });
    }

    // Extraer el token después de 'Bearer '
    const token = authHeader.split(' ')[1];

    try {
        // Verificar el token con la clave secreta
        const verified = jwt.verify(token, 'secreto');
        req.user = verified; // Guardar los datos del token en req.user
        next(); // Continuar con la siguiente función
    } catch (err) {
        res.status(400).json({ error: 'Token no válido.' });
    }
}

// Ejemplo de una ruta protegida
// Ruta para obtener todos los productos activos
app.get('/api/productos', authMiddleware, (req, res) => {
    db.all('SELECT * FROM productos WHERE estado = "activo"', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener los productos' });
        }
        res.json({ productos: rows });
    });
});

// Ruta para insertar un producto
app.post('/api/productos', (req, res) => {
    const { nombre, categoria, precio_venta, costo, cantidad_stock, tipo_producto, descripcion, codigo_barra } = req.body;

    // Verificar que todos los campos requeridos estén presentes
    if (!nombre || !categoria || !precio_venta || !costo || !cantidad_stock || !tipo_producto) {
        return res.status(400).json({ error: 'Por favor, complete todos los campos requeridos.' });
    }

    // Inserción de datos en la tabla productos
    const sql = `INSERT INTO productos (nombre, categoria, precio_venta, costo, cantidad_stock, tipo_producto, descripcion, codigo_barra) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [nombre, categoria, precio_venta, costo, cantidad_stock, tipo_producto, descripcion, codigo_barra];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, mensaje: 'Producto creado exitosamente' });
    });
});

// Ruta para agregar un detalle de venta manualmente
app.post('/api/detalle-ventas', (req, res) => {
    const { venta_id, producto_id, cantidad, precio_unitario } = req.body;

    if (!venta_id || !producto_id || !cantidad || !precio_unitario) {
        return res.status(400).json({ error: 'Por favor, complete todos los campos requeridos.' });
    }

    const sql = `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`;
    const params = [venta_id, producto_id, cantidad, precio_unitario];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, mensaje: 'Detalle de venta agregado exitosamente.' });
    });
});



// Ruta para obtener todos los productos activos
app.get('/api/productos', (req, res) => {
    db.all('SELECT * FROM productos WHERE estado = "activo"', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ datos: rows });
    });
});

// Ruta para obtener un producto específico por ID
app.get('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM productos WHERE id = ? AND estado = "activo"', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(row);
    });
});

// Nueva ruta para buscar productos por código de barras
app.get('/api/productos/codigo/:codigo_barra', (req, res) => {
    const { codigo_barra } = req.params;
    db.get('SELECT * FROM productos WHERE codigo_barra = ? AND estado = "activo"', [codigo_barra], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(row);
    });
});

// Ruta para obtener los detalles de una venta específica
app.get('/api/detalle-ventas/:venta_id', (req, res) => {
    const { venta_id } = req.params;

    const sql = `SELECT * FROM detalle_ventas WHERE venta_id = ?`;
    db.all(sql, [venta_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ detalles: rows });
    });
});

// Ruta para obtener todas las sucursales
app.get('/api/sucursales', (req, res) => {
    db.all('SELECT * FROM sucursales', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ sucursales: rows });
    });
});

// Ruta para obtener una sucursal específica por ID
app.get('/api/sucursales/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM sucursales WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Sucursal no encontrada.' });
        }
        res.json(row);
    });
});

// Ruta para obtener todos los usuarios
app.get('/api/usuarios', (req, res) => {
    db.all('SELECT id, username, role FROM usuarios', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ usuarios: rows });
    });
});

// Ruta para buscar productos por nombre
app.get('/api/productos/buscar/:nombre', (req, res) => {
    const { nombre } = req.params;
    db.all('SELECT * FROM productos WHERE nombre LIKE ? AND estado = "activo"', [`%${nombre}%`], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ datos: rows });
    });
});

// Ruta para registrar una venta
app.post('/api/ventas', (req, res) => {
    const { productos, total, metodo_pago } = req.body;

    // Primero, insertamos la venta en la tabla de ventas
    const sqlVenta = `INSERT INTO ventas (total, metodo_pago) VALUES (?, ?)`;
    const paramsVenta = [total, metodo_pago];

    db.run(sqlVenta, paramsVenta, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const ventaId = this.lastID;  // ID de la venta recién creada

        // Ahora, registramos los detalles de la venta (productos vendidos)
        productos.forEach(producto => {
            const sqlDetalle = `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`;
            const paramsDetalle = [ventaId, producto.id, producto.cantidad, producto.precio_unitario];

            db.run(sqlDetalle, paramsDetalle, function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
            });

            // Actualizar el stock de cada producto vendido
            const sqlUpdateStock = `UPDATE productos SET cantidad_stock = cantidad_stock - ? WHERE id = ? AND estado = "activo"`;
            const paramsUpdateStock = [producto.cantidad, producto.id];

            db.run(sqlUpdateStock, paramsUpdateStock, function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
            });
        });

        res.status(201).json({ mensaje: 'Venta registrada exitosamente', ventaId });
    });
});

// Ruta para agregar una sucursal
app.post('/api/sucursales', (req, res) => {
    const { ubicacion, gerente_id } = req.body;

    if (!ubicacion || !gerente_id) {
        return res.status(400).json({ error: 'Por favor, complete todos los campos requeridos.' });
    }

    const sql = `INSERT INTO sucursales (ubicacion, gerente_id) VALUES (?, ?)`;
    const params = [ubicacion, gerente_id];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, mensaje: 'Sucursal agregada exitosamente.' });
    });
});

// Ruta para obtener todas las ventas
app.get('/api/ventas', (req, res) => {
    const sql = `SELECT v.id, v.fecha, v.total, v.metodo_pago, dv.producto_id, dv.cantidad, dv.precio_unitario
                 FROM ventas v
                 JOIN detalle_ventas dv ON v.id = dv.venta_id`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({ ventas: rows });
    });
});

// Ruta para eliminar un detalle de venta
app.delete('/api/detalle-ventas/:id', (req, res) => {
    const { id } = req.params;

    const sql = `DELETE FROM detalle_ventas WHERE id = ?`;
    db.run(sql, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Detalle de venta no encontrado.' });
        }
        res.json({ mensaje: 'Detalle de venta eliminado exitosamente.' });
    });
});

// Ruta para eliminar una sucursal
app.delete('/api/sucursales/:id', (req, res) => {
    const { id } = req.params;

    const sql = `DELETE FROM sucursales WHERE id = ?`;
    db.run(sql, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Sucursal no encontrada.' });
        }
        res.json({ mensaje: 'Sucursal eliminada exitosamente.' });
    });
});

// Ruta para actualizar un producto
app.put('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, categoria, precio_venta, costo, cantidad_stock, tipo_producto, descripcion, codigo_barra } = req.body;

    // Verificar que al menos uno de los campos a actualizar esté presente
    if (!nombre && !categoria && !precio_venta && !costo && !cantidad_stock && !tipo_producto && !descripcion && !codigo_barra) {
        return res.status(400).json({ error: 'Por favor, proporcione al menos un campo para actualizar.' });
    }

    // Crear una lista de columnas a actualizar
    const updates = [];
    const params = [];

    if (nombre) {
        updates.push('nombre = ?');
        params.push(nombre);
    }
    if (categoria) {
        updates.push('categoria = ?');
        params.push(categoria);
    }
    if (precio_venta) {
        updates.push('precio_venta = ?');
        params.push(precio_venta);
    }
    if (costo) {
        updates.push('costo = ?');
        params.push(costo);
    }
    if (cantidad_stock) {
        updates.push('cantidad_stock = ?');
        params.push(cantidad_stock);
    }
    if (tipo_producto) {
        updates.push('tipo_producto = ?');
        params.push(tipo_producto);
    }
    if (descripcion) {
        updates.push('descripcion = ?');
        params.push(descripcion);
    }
    if (codigo_barra) {
        updates.push('codigo_barra = ?');
        params.push(codigo_barra);
    }

    // Agregar el ID del producto a los parámetros
    params.push(id);

    // Ejecutar la consulta de actualización
    const sql = `UPDATE productos SET ${updates.join(', ')} WHERE id = ?`;

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ mensaje: 'Producto actualizado exitosamente' });
    });
});

// Ruta para eliminar un producto (marcarlo como inactivo)
app.delete('/api/productos/:id', (req, res) => {
    const { id } = req.params;

    const sql = `UPDATE productos SET estado = 'inactivo' WHERE id = ?`;
    db.run(sql, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ mensaje: 'Producto eliminado (marcado como inactivo) exitosamente' });
    });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});