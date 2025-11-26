// C:\Codigos\HTml\gestion-educativa\backend\app.js

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ========================================
// MIDDLEWARES GLOBALES
// ========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Por si mandas formularios clásicos

// Archivos estáticos de la carpeta "public"
app.use(express.static('public'));

// Archivos estáticos para uploads (tareas, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========================================
// RUTAS LOGIN / USUARIOS / REGISTRO
// ========================================
const loginRoutes = require('./routes/login/loginRoutes');
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const registroRoutes = require('./routes/registro/registroRoutes');
const recuperarRoutes = require('./routes/recuperarContrasena/recuperarContrasenaRoutes');

app.use('/api', loginRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/registro', registroRoutes);
app.use('/api/recuperar', recuperarRoutes);

// ========================================
// RUTAS DEL MAESTRO
// ========================================
const dashboardRoutes = require('./controllers/maestro/dashboard/dashboardRoutes');
const estudiantesRoutes = require('./controllers/maestro/estudiantes/estudiantesRoutes');
const asistenciaRoutes = require('./controllers/maestro/asistencia/asistenciaRoutes');
const tareasRoutes = require('./controllers/maestro/tareas/tareasRoutes');
const calificacionesRoutes = require('./controllers/maestro/calificaciones/calificacionesRoutes');
const boletaRoutes = require('./controllers/maestro/calificaciones/boletaRoutes');

// 🔹 Rutas de materias (carpeta REAL: controllers/maestro/materias)
const materiasRoutes = require('./controllers/maestro/materias/materiasRoutes');

app.use('/api/maestro/dashboard', dashboardRoutes);
app.use('/api/maestro/estudiantes', estudiantesRoutes);
app.use('/api/maestro/asistencia', asistenciaRoutes);
app.use('/api/maestro/tareas', tareasRoutes);
app.use('/api/calificaciones', calificacionesRoutes);
app.use('/api/boleta', boletaRoutes);

// ✅ ÚNICA definición para materias
// Ej: GET http://localhost:3000/api/materias/lista
app.use('/api/materias', materiasRoutes);

// ========================================
// MANEJO 404
// ========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado: ' + req.originalUrl
  });
});

module.exports = app;
