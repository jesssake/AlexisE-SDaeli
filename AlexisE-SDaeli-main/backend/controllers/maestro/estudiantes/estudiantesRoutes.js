const express = require('express');
const router = express.Router();
const {
  getEstudiantes,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante
} = require('./estudiantesController');

// =============================
// Rutas para estudiantes
// =============================
router.get('/', getEstudiantes);           // GET todos los estudiantes
router.post('/', crearEstudiante);         // POST crear estudiante (tutor + niño)
router.put('/:id', actualizarEstudiante);  // PUT actualizar estudiante
router.delete('/:id', eliminarEstudiante); // DELETE eliminar estudiante

module.exports = router;