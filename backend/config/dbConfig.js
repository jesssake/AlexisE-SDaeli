// C:\Codigos\HTml\gestion-educativa\backend\config\dbConfig.js

const mysql = require("mysql2/promise");

// ⚠ Ajusta tus credenciales aquí
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: '2025Elianadavid',
  database: "gestion_educativa",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
