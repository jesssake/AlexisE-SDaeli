// backend/config/dbConfig.js
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "2025Elianadavid",
  database: process.env.DB_NAME || "gestion_educativa",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4" // 👈 Correcto: dentro del objeto
});

module.exports = pool;
