// backend/config/dbConfig.js
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "2025Elianadavid",
  database: "gestion_educativa",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4" // 👈 Correcto: dentro del objeto
});

module.exports = pool;
