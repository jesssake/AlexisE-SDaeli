const express = require('express');
const router = express.Router();
const MateriasController = require('./materiasController');

console.log('🔍 Cargando rutas de materias...');
console.log('📂 Controlador y rutas en el mismo directorio');

// =====================================================
// 🚀 RUTAS DE MATERIAS PARA MAESTROS
// =====================================================

// Listar todas las materias (ruta principal)
router.get('/listar', (req, res) => {
    console.log('📚 GET /listar - Listando materias');
    MateriasController.listarMaterias(req, res);
});

// 📌 ALIAS para /lista (que el frontend busca)
router.get('/lista', (req, res) => {
    console.log('📚 GET /lista - Redirigiendo a /listar (compatibilidad frontend)');
    MateriasController.listarMaterias(req, res);
});

// Obtener materia por ID
router.get('/:id_materia', (req, res) => {
    console.log(`🔍 GET /${req.params.id_materia} - Obteniendo materia`);
    MateriasController.obtenerMateriaPorId(req, res);
});

// Crear nueva materia
router.post('/crear', (req, res) => {
    console.log('📝 POST /crear - Creando nueva materia');
    MateriasController.crearMateria(req, res);
});

// Actualizar materia existente
router.put('/actualizar', (req, res) => {
    console.log('🔄 PUT /actualizar - Actualizando materia');
    MateriasController.actualizarMateria(req, res);
});

// Eliminar materia
router.delete('/eliminar', (req, res) => {
    console.log('🗑️ DELETE /eliminar - Eliminando materia');
    MateriasController.eliminarMateria(req, res);
});

// Obtener estadísticas de materias
router.get('/estadisticas', (req, res) => {
    console.log('📊 GET /estadisticas - Estadísticas de materias');
    MateriasController.obtenerEstadisticasMaterias(req, res);
});

// =====================================================
// 📊 ENDPOINTS DE SALUD Y PRUEBA
// =====================================================

// Endpoint de salud
router.get('/health', (req, res) => {
    console.log('❤️ GET /health - Verificando salud del servicio de materias');
    res.json({
        ok: true,
        service: 'materias-maestro-api',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        endpoints: {
            listar: 'GET /api/materias/listar',
            lista: 'GET /api/materias/lista (alias)',
            crear: 'POST /api/materias/crear',
            actualizar: 'PUT /api/materias/actualizar',
            eliminar: 'DELETE /api/materias/eliminar',
            estadisticas: 'GET /api/materias/estadisticas'
        }
    });
});

// Endpoint de prueba simple
router.get('/test', (req, res) => {
    console.log('🧪 GET /test - Endpoint de prueba materias');
    res.json({
        ok: true,
        message: '✅ Sistema de materias para maestros funcionando correctamente',
        service: 'materias-maestro-api',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        features: [
            '📚 Gestión completa de materias',
            '🎨 Colores e iconos personalizados',
            '📊 Estadísticas detalladas',
            '🛡️ Autenticación simplificada',
            '📅 Filtros y ordenamiento'
        ],
        estructura_tabla: 'id_materia, nombre, descripcion, created_by, color, icono',
        rutas_compatibles: [
            '/api/materias/listar (principal)',
            '/api/materias/lista (alias para frontend)',
            '/api/materias/crear',
            '/api/materias/actualizar',
            '/api/materias/eliminar',
            '/api/materias/estadisticas',
            '/api/materias/health',
            '/api/materias/test'
        ]
    });
});

console.log('✅ materiasRoutes configurado con', router.stack.length, 'rutas');

module.exports = router;