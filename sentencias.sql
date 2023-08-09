CREATE DATABASE bancosolar;

USE bancosolar;

CREATE TABLE usuarios (id SERIAL PRIMARY KEY, nombre VARCHAR(50),
balance FLOAT CHECK (balance >= 0));

CREATE INDEX idx_usuarios_nombre ON usuarios(nombre);

CREATE TABLE transferencias (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  emisor VARCHAR(50),
  receptor VARCHAR(50),
  monto FLOAT,
  fecha TIMESTAMP,
  FOREIGN KEY (emisor) REFERENCES usuarios(nombre),
  FOREIGN KEY (receptor) REFERENCES usuarios(nombre)
);

CREATE USER 'administradorbanco2'@'localhost' IDENTIFIED WITH mysql_native_password BY '1234';

DROP TABLE transferencias;
DROP TABLE usuarios;

SELECT * FROM usuarios;
SELECT * FROM transferencias;