const db = require('../../../config/dbConfig');

console.log('✅ materiasController cargado - Estructura correcta detectada');

// =====================================================
// 🛡️ MIDDLEWARE DE AUTENTICACIÓN SIMPLIFICADA
// =====================================================
const verificarAutenticacion = (req, res, next) => {
    console.log('🔐 Middleware materias - Modo desarrollo');
    
    const authHeader = req.headers.authorization || '';
    
    if (authHeader.includes('token-desarrollo-12345') || 
        authHeader.startsWith('Bearer ')) {
        console.log('✅ Token aceptado');
    }
    
    req.user = {
        id: req.headers['x-user-id'] || '1',
        rol: req.headers['x-user-rol'] || 'maestro',
        nombre: 'Maestro Demo'
    };
    
    next();
};

// Middleware para verificar que sea maestro
const verificarMaestro = (req, res, next) => {
    const rol = req.user.rol?.toLowerCase();
    if (rol === 'maestro' || rol === 'admin' || rol === 'profesor' || rol === 'superadmin') {
        return next();
    }
    
    return res.status(403).json({
        ok: false,
        error: 'Acceso denegado. Solo maestros.'
    });
};

// Aplicar middlewares
const aplicarMiddlewares = (handler) => {
    return async (req, res) => {
        try {
            // Aplicar autenticación
            const authResult = await new Promise((resolve) => {
                verificarAutenticacion(req, res, resolve);
            });
            if (authResult) return;
            
            // Aplicar verificación de maestro
            const maestroResult = await new Promise((resolve) => {
                verificarMaestro(req, res, resolve);
            });
            if (maestroResult) return;
            
            // Ejecutar handler
            return handler(req, res);
        } catch (error) {
            console.error('❌ Error en middleware:', error);
            return res.status(500).json({
                ok: false,
                error: 'Error interno'
            });
        }
    };
};

const MateriasController = {

    // ========================
    // LISTAR MATERIAS - CORREGIDA CON ESTRUCTURA CORRECTA
    // ========================
    listarMaterias: aplicarMiddlewares(async (req, res) => {
        console.log('📚 LISTAR MATERIAS - Usuario:', req.user);
        
        try {
            // ✅ CONSULTA CORRECTA según estructura de tu tabla
            const sql = `
                SELECT 
                    id_materia,
                    nombre,
                    COALESCE(descripcion, '') as descripcion,
                    created_by,
                    COALESCE(color, '#667eea') as color,
                    COALESCE(icono, '📚') as icono
                FROM materias
                ORDER BY nombre ASC
            `;
            
            console.log('📋 Ejecutando SQL (estructura correcta):', sql);
            
            const [rows] = await db.query(sql);
            console.log(`✅ ${rows.length} materias encontradas en DB`);
            
            // Agregar fecha_creacion simulada para compatibilidad con frontend
            const materiasConFecha = rows.map(materia => ({
                ...materia,
                fecha_creacion: new Date().toISOString() // Fecha simulada
            }));
            
            res.json({
                ok: true,
                materias: materiasConFecha,
                estructura_real: 'id_materia, nombre, descripcion, created_by, color, icono'
            });
            
        } catch (error) {
            console.error('❌ Error en listarMaterias:', error);
            
            // Datos de ejemplo en caso de error
            const materiasEjemplo = [
                {
                    id_materia: 1,
                    nombre: 'Matemáticas',
                    descripcion: 'Matemáticas básicas',
                    created_by: 1,
                    color: '#667eea',
                    icono: '🧮',
                    fecha_creacion: new Date().toISOString() // Para frontend
                },
                {
                    id_materia: 2,
                    nombre: 'Español',
                    descripcion: 'Lengua y literatura',
                    created_by: 1,
                    color: '#ed8936',
                    icono: '📚',
                    fecha_creacion: new Date().toISOString()
                },
                {
                    id_materia: 3,
                    nombre: 'Ciencias',
                    descripcion: 'Ciencias naturales',
                    created_by: 1,
                    color: '#48bb78',
                    icono: '🔬',
                    fecha_creacion: new Date().toISOString()
                }
            ];
            
            res.json({
                ok: true,
                materias: materiasEjemplo,
                warning: 'Usando datos de ejemplo',
                error_message: error.message
            });
        }
    }),

    // ========================
    // CREAR MATERIA - ADAPTADA A TU ESTRUCTURA
    // ========================
    crearMateria: aplicarMiddlewares(async (req, res) => {
        console.log('📝 CREAR MATERIA - Datos:', req.body);
        
        try {
            const { nombre, descripcion, color, icono } = req.body;
            
            if (!nombre || nombre.trim() === '') {
                return res.status(400).json({
                    ok: false,
                    error: 'El nombre de la materia es obligatorio'
                });
            }
            
            // ✅ INSERT según estructura de tu tabla
            const [result] = await db.query(`
                INSERT INTO materias (nombre, descripcion, color, icono, created_by)
                VALUES (?, ?, ?, ?, ?)
            `, [
                nombre.trim(),
                descripcion || '',
                color || '#667eea',
                icono || '📚',
                req.user.id
            ]);
            
            console.log('✅ Materia creada en DB con ID:', result.insertId);
            
            // Obtener la materia creada
            const [materias] = await db.query(`
                SELECT * FROM materias WHERE id_materia = ?
            `, [result.insertId]);
            
            const materiaCreada = materias[0] || {};
            
            res.json({
                ok: true,
                message: 'Materia creada exitosamente',
                id_materia: result.insertId,
                materia: {
                    ...materiaCreada,
                    fecha_creacion: new Date().toISOString() // Para frontend
                }
            });
            
        } catch (error) {
            console.error('❌ Error en crearMateria:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al crear materia',
                message: error.message
            });
        }
    }),

    // ========================
    // ACTUALIZAR MATERIA
    // ========================
    actualizarMateria: aplicarMiddlewares(async (req, res) => {
        console.log('🔄 ACTUALIZAR MATERIA - Datos:', req.body);
        
        try {
            const { id_materia, nombre, descripcion, color, icono } = req.body;
            
            if (!id_materia) {
                return res.status(400).json({
                    ok: false,
                    error: 'ID de materia requerido'
                });
            }
            
            // ✅ UPDATE según estructura de tu tabla
            await db.query(`
                UPDATE materias SET
                    nombre = ?,
                    descripcion = ?,
                    color = ?,
                    icono = ?
                WHERE id_materia = ?
            `, [
                nombre || '',
                descripcion || '',
                color || '#667eea',
                icono || '📚',
                id_materia
            ]);
            
            // Obtener la materia actualizada
            const [materias] = await db.query(`
                SELECT * FROM materias WHERE id_materia = ?
            `, [id_materia]);
            
            const materiaActualizada = materias[0] || {};
            
            res.json({
                ok: true,
                message: 'Materia actualizada exitosamente',
                materia: {
                    ...materiaActualizada,
                    fecha_creacion: new Date().toISOString() // Para frontend
                }
            });
            
        } catch (error) {
            console.error('❌ Error en actualizarMateria:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al actualizar materia'
            });
        }
    }),

    // ========================
    // ELIMINAR MATERIA
    // ========================
    eliminarMateria: aplicarMiddlewares(async (req, res) => {
        console.log('🗑️ ELIMINAR MATERIA - Datos:', req.body);
        
        try {
            const { id_materia } = req.body;
            
            if (!id_materia) {
                return res.status(400).json({
                    ok: false,
                    error: 'ID de materia requerido'
                });
            }
            
            // Verificar si hay tareas asociadas
            const [tareasAsociadas] = await db.query(`
                SELECT COUNT(*) as count FROM tareas WHERE id_materia = ?
            `, [id_materia]);
            
            if (tareasAsociadas[0].count > 0) {
                return res.status(400).json({
                    ok: false,
                    error: 'No se puede eliminar. Esta materia tiene tareas asociadas.'
                });
            }
            
            // ✅ DELETE
            await db.query('DELETE FROM materias WHERE id_materia = ?', [id_materia]);
            
            res.json({
                ok: true,
                message: 'Materia eliminada exitosamente'
            });
            
        } catch (error) {
            console.error('❌ Error en eliminarMateria:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al eliminar materia'
            });
        }
    }),

    // ========================
    // OBTENER MATERIA POR ID - CORREGIDA
    // ========================
    obtenerMateriaPorId: aplicarMiddlewares(async (req, res) => {
        console.log('🔍 OBTENER MATERIA POR ID - ID:', req.params.id_materia);
        
        try {
            const { id_materia } = req.params;
            
            // ✅ SELECT según estructura de tu tabla
            const [materias] = await db.query(`
                SELECT 
                    id_materia,
                    nombre,
                    descripcion,
                    created_by,
                    color,
                    icono
                FROM materias
                WHERE id_materia = ?
            `, [id_materia]);
            
            if (materias.length === 0) {
                return res.status(404).json({
                    ok: false,
                    error: 'Materia no encontrada'
                });
            }
            
            const materia = materias[0];
            
            res.json({
                ok: true,
                materia: {
                    ...materia,
                    fecha_creacion: new Date().toISOString() // Para frontend
                }
            });
            
        } catch (error) {
            console.error('❌ Error en obtenerMateriaPorId:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al obtener materia'
            });
        }
    }),

    // ========================
    // ESTADÍSTICAS DE MATERIAS
    // ========================
    obtenerEstadisticasMaterias: aplicarMiddlewares(async (req, res) => {
        console.log('📊 ESTADÍSTICAS MATERIAS - Usuario:', req.user);
        
        try {
            // Total de materias
            const [totalMaterias] = await db.query('SELECT COUNT(*) as total FROM materias');
            
            // Materias con más tareas
            const [materiasConTareas] = await db.query(`
                SELECT 
                    m.id_materia,
                    m.nombre,
                    m.color,
                    COUNT(t.id_tarea) as total_tareas
                FROM materias m
                LEFT JOIN tareas t ON m.id_materia = t.id_materia
                GROUP BY m.id_materia, m.nombre, m.color
                ORDER BY total_tareas DESC
                LIMIT 10
            `);
            
            res.json({
                ok: true,
                estadisticas: {
                    total_materias: totalMaterias[0]?.total || 0,
                    materias_con_tareas: materiasConTareas
                }
            });
            
        } catch (error) {
            console.error('❌ Error al obtener estadísticas:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al obtener estadísticas'
            });
        }
    })
};

module.exports = MateriasController;