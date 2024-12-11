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
    )`, function(err) {
        if (err) {
            console.error('Error al crear la tabla de usuarios:', err);
        } else {
            console.log('Tabla usuarios creada correctamente o ya existe');
        }
    });

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
        // Verificar si el nombre de usuario ya existe
        db.get(`SELECT * FROM usuarios WHERE username = ?`, [username], (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Error al verificar el usuario.' });
            }
            if (row) {
                return res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
            }

            // Si no existe, proceder con el registro
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al encriptar la contraseña.' });
                }

                db.run(`INSERT INTO usuarios (username, contraseña, role) VALUES (?, ?, 'user')`, [username, hashedPassword], function (err) {
                    if (err) {
                        return res.status(500).json({ error: 'Error al registrar el usuario.' });
                    }
                    return res.status(201).json({ message: 'Usuario registrado con éxito.' });
                });
            });
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

app.post('/api/comprar', (req, res) => {
    const { productos, metodo_pago } = req.body;
  
    if (!productos || productos.length === 0) {
      return res.status(400).json({ error: 'No hay productos para procesar.' });
    }
  
    // Verificar que haya suficiente stock para cada producto
    const stockInsuficiente = productos.some((p) => p.cantidad > p.cantidad_stock);
    if (stockInsuficiente) {
      return res.status(400).json({ error: 'Algunos productos tienen stock insuficiente.' });
    }
  
    const total = productos.reduce((sum, p) => sum + p.cantidad * p.precio, 0);
  
    db.serialize(() => {
      db.run(
        `INSERT INTO ventas (total, metodo_pago) VALUES (?, ?)`,
        [total, metodo_pago],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Error al registrar la venta.' });
          }
          const ventaId = this.lastID;
          const detalleQueries = productos.map((p) => {
            return new Promise((resolve, reject) => {
              db.run(
                `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario)
                 VALUES (?, ?, ?, ?)`,
                [ventaId, p.id, p.cantidad, p.precio],
                (err) => {
                  if (err) {
                    return reject(err);
                  }
  
                  db.run(
                    `UPDATE productos SET cantidad_stock = cantidad_stock - ? WHERE id = ?`,
                    [p.cantidad, p.id],
                    (err) => {
                      if (err) {
                        return reject(err);
                      }
                      resolve();
                    }
                  );
                }
              );
            });
          });
  
          Promise.all(detalleQueries)
            .then(() => res.json({ message: 'Compra realizada con éxito.' }))
            .catch((err) => res.status(500).json({ error: 'Error al procesar la compra.' }));
        }
      );
    });
  });
  
// Obtener todos los productos
app.get('/api/productos', (req, res) => {
    db.all('SELECT * FROM productos WHERE estado = "activo"', [], (err, rows) => {
        if (err) {
            console.error('Error al obtener los productos:', err);
            return res.status(500).json({ error: 'Error al obtener los productos' });
        }
        if (rows.length === 0) {
            return res.status(404).json({ error: 'No hay productos activos.' });
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

// Ruta POST para registrar una venta
app.post('/api/ventas', (req, res) => {
    const { total, metodo_pago } = req.body;
  
    // Verificar que el total y el método de pago estén presentes
    if (!total || !metodo_pago) {
      return res.status(400).json({ error: 'Total y método de pago son requeridos.' });
    }
  
    // Insertar la venta en la tabla `ventas`
    const query = `INSERT INTO ventas (total, metodo_pago) VALUES (?, ?)`;
    const params = [total, metodo_pago];
  
    db.run(query, params, function(err) {
      if (err) {
        console.error('Error al registrar la venta:', err);
        return res.status(500).json({ error: 'Error al registrar la venta.' });
      }
  
      // Responder con el ID de la venta registrada
      res.json({ message: 'Venta registrada con éxito.', ventaId: this.lastID });
    });
  });

// Nueva ruta para obtener detalles de productos
app.post('/api/productos/detalles', (req, res) => {
    const productos = req.body.productos;
    // Lógica para obtener los detalles de los productos
    res.json({ detalles: productos });
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});