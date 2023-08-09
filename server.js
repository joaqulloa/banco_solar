require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = 3000;


// configuracion de base de datos
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// conexión con base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
  } else {
    console.log('Conexión exitosa a la base de datos MySQL');
  }
});

// Middleware para parsear el cuerpo de las solicitudes como JSON
app.use(express.json());

// Ruta: Sirve los archivos estáticos (CSS y scripts)
app.use(express.static(path.join(__dirname, 'public')));

// Ruta: Devuelve la aplicación cliente disponible en el apoyo de la prueba
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// recibe los datos de registro de usuarios 
app.post('/usuario', (req, res) => {
  const { nombre, balance } = req.body;

  const query = 'INSERT INTO usuarios (nombre, balance) VALUES (?, ?)';
  connection.query(query, [nombre, balance], (err, result) => {
    if (err) {
      console.error('Error al insertar un nuevo usuario:', err);
      res.status(500).json({ error: 'Error al insertar un nuevo usuario' });
    } else {
      console.log('Nuevo usuario insertado:', result.insertId);
      res.sendStatus(200);
    }
  });
});

// muestra todos los usuarios registrados
app.get('/usuarios', (req, res) => {
  const query = 'SELECT * FROM usuarios';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los usuarios:', err);
      res.status(500).json({ error: 'Error al obtener los usuarios' });
    } else {
      res.json(results);
    }
  });
});

// actualiza el usuario
app.put('/usuario/:id', (req, res) => {
  const userId = req.params.id;
  const { nombre, balance } = req.body;

  const query = 'UPDATE usuarios SET nombre = ?, balance = ? WHERE id = ?';
  connection.query(query, [nombre, balance, userId], (err, result) => {
    if (err) {
      console.error('Error al actualizar el usuario:', err);
      res.status(500).json({ error: 'Error al actualizar el usuario' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
    } else {
      console.log('Usuario actualizado:', userId);
      res.sendStatus(200);
    }
  });
});

//eliminar usuario
app.delete('/usuario/:nombre', (req, res) => {
  let nombre = req.params.nombre;

  const query = 'SELECT * FROM usuarios WHERE nombre = ?';
  connection.query(query, [nombre], (err, result) => {
    if (err) {
      console.error('Error al eliminar el usuario:', err);
      res.status(500).json({ error: 'Error al eliminar el usuario' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
    } else {
      console.log('Usuario eliminado:', nombre);
      res.sendStatus(200);
    }
  });
});


// Recibe transferencia
app.post('/transferencias', (req, res) => {
  const { emisor, receptor, monto } = req.body;

  connection.beginTransaction((err) => {
    if (err) {
      console.error('Error al iniciar la transacción:', err);
      res.status(500).json({ error: 'Error al iniciar la transacción' });
      return;
    }

    const selectQuery = 'SELECT id FROM usuarios WHERE nombre = ?';
    connection.query(selectQuery, [emisor], (err, results) => {

      if (err) {
        console.error('Error al obtener el ID del emisor:', err);
        connection.rollback(() => {
          res.status(500).json({ error: 'Error al realizar la transferencia' });
        });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ error: 'Emisor no encontrado' });
        return;
      }

      const emisorId = results[0].id;

      const transferQuery =
        'INSERT INTO transferencias (emisor, receptor, monto, fecha) VALUES (?, ?, ?, NOW())';
      connection.query(transferQuery, [emisor, receptor, monto], (err, result) => {
        if (err) {
          console.error('Error al insertar la transferencia:', err);
          connection.rollback(() => {
            res.status(500).json({ error: 'Error al realizar la transferencia' });
          });
        } else {
          console.log('Transferencia registrada:', result.insertId);

          const updateQuery1 =
            'UPDATE usuarios SET balance = balance - ? WHERE nombre = ?';

          const updateQuery2 =
            'UPDATE usuarios SET balance = balance + ? WHERE nombre = ?';

          connection.query(updateQuery1, [monto, emisor], (err) => {
              if (err) {
                console.error('Error al actualizar los balances:', err);
                connection.rollback(() => {
                  res.status(500).json({ error: 'Error al actualizar los balances' });
                });
              } else {
                console.log('Balances actualizados');
                connection.commit((err) => {
                  if (err) {
                    console.error('Error al confirmar la transacción:', err);
                    connection.rollback(() => {
                      res.status(500).json({ error: 'Error al confirmar la transacción' });
                    });
                  } else {
                    console.log('Transacción completada');
                  }
                });
              }
            }
          );

          connection.query(updateQuery2, [monto, receptor], (err) => {
            if (err) {
              console.error('Error al actualizar los balances:', err);
              connection.rollback(() => {
                res.status(500).json({ error: 'Error al actualizar los balances' });
              });
            } else {
              console.log('Balances actualizados');
              connection.commit((err) => {
                if (err) {
                  console.error('Error al confirmar la transacción:', err);
                  connection.rollback(() => {
                    res.status(500).json({ error: 'Error al confirmar la transacción' });
                  });
                } else {
                  console.log('Transacción completada');
                  fetchTransfers(); // Agregado: Actualiza la tabla de transferencias
                  res.sendStatus(200);
                }
              });
            }
          }
        );


        }
      });
    });
  });
});


// muestra las transferencias realizadas
app.get('/transferencias', (req, res) => {
  const query = 'SELECT * FROM transferencias';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener las transferencias:', err);
      res.status(500).json({ error: 'Error al obtener las transferencias' });
    } else {
      res.json(results);
    }
  });
});

function fetchTransfers() {
  const query = 'SELECT * FROM transferencias';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener las transferencias:', err);
    } else {
      console.log(results);
    }
  });
}

// iniciamos el servidor
app.listen(port, () => {
  console.log(`Servidor iniciado en http://localhost:${port}`);
});
