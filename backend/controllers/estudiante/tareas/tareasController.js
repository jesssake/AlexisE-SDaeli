const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Cargar dbConfig
const db = require('../../../config/dbConfig');
console.log('✅ tareasController (estudiante): dbConfig cargado exitosamente');

// =====================================================
// 📦 MIDDLEWARES INTEGRADOS - CORREGIDO PARA ESTUDIANTES
// =====================================================

// Middleware de autenticación para estudiantes
const verificarAutenticacionEstudiante = (req, res, next) => {
    console.log('🔐 MIDDLEWARE ESTUDIANTE - Verificación simplificada');
    
    // Mostrar headers para depuración
    console.log('📋 Headers recibidos:', {
        authorization: req.headers.authorization,
        'x-user-id': req.headers['x-user-id'],
        'x-user-rol': req.headers['x-user-rol']
    });
    
    // ✅ PARA DESARROLLO: Siempre permitir acceso
    const authHeader = req.headers.authorization || '';
    
    if (authHeader.includes('token-desarrollo-12345') || 
        authHeader.includes('eyJhbGciOiJ') || 
        authHeader.startsWith('Bearer ')) {
        
        console.log('✅ Token aceptado (modo desarrollo)');
        
        // Usar userId de headers o por defecto
        const userId = req.headers['x-user-id'] || '2'; // ID de estudiante por defecto
        const userRol = req.headers['x-user-rol'] || 'estudiante';
        
        req.user = {
            id: parseInt(userId),
            rol: userRol,
            nombre: 'Estudiante Demo'
        };
        
        console.log('👤 Estudiante configurado:', req.user);
        return next();
    }
    
    // Si no hay token, igual permitir acceso para desarrollo
    console.warn('⚠️ No hay token válido, pero permitiendo acceso (modo desarrollo)');
    
    req.user = {
        id: 2, // ID de estudiante por defecto
        rol: 'estudiante',
        nombre: 'Estudiante Demo'
    };
    
    console.log('👤 Estudiante por defecto:', req.user);
    next();
};

// Middleware para verificar que sea estudiante
const verificarEstudiante = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            ok: false,
            error: 'Estudiante no autenticado'
        });
    }
    
    // Verificar si el usuario es estudiante
    const rol = req.user.rol?.toLowerCase();
    if (rol === 'estudiante' || rol === 'alumno' || rol === 'user') {
        return next();
    }
    
    return res.status(403).json({
        ok: false,
        error: 'Acceso denegado. Solo estudiantes pueden acceder a esta funcionalidad.'
    });
};

// =====================================================
// ⚙️ CONFIGURACIÓN MULTER PARA ENTREGAS
// =====================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../../../uploads/entregas');
        
        // Crear directorio si no existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'entrega-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/zip',
            'application/x-rar-compressed',
            'text/plain',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'), false);
        }
    }
}).single('archivo_entrega');

// Middleware para manejar la subida de archivos
const uploadMiddleware = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                error: err.message
            });
        }
        next();
    });
};

// =====================================================
// 🎯 CONTROLADOR DE TAREAS PARA ESTUDIANTES
// =====================================================
class TareasController {
    
    // Aplicar middleware de autenticación y verificación de estudiante
    static applyMiddleware(handler) {
        return async (req, res) => {
            try {
                // Aplicar autenticación
                const authResult = await new Promise((resolve) => {
                    verificarAutenticacionEstudiante(req, res, resolve);
                });
                
                if (authResult) return; // Si hubo error, ya se envió respuesta
                
                // Aplicar verificación de estudiante
                const estudianteResult = await new Promise((resolve) => {
                    verificarEstudiante(req, res, resolve);
                });
                
                if (estudianteResult) return; // Si hubo error, ya se envió respuesta
                
                // Ejecutar el handler original
                return handler(req, res);
            } catch (error) {
                console.error('❌ Error en middleware:', error);
                return res.status(500).json({
                    ok: false,
                    error: 'Error interno del servidor'
                });
            }
        };
    }

    // =====================================================
    // LISTAR TAREAS DISPONIBLES PARA EL ESTUDIANTE
    // =====================================================
    async listarTareas(req, res) {
        try {
            const estudianteId = req.user.id;
            
            console.log('👨‍🎓 Estudiante ID:', estudianteId);
            
            // Obtener nombre del estudiante
            let nombreEstudiante = 'Estudiante';
            
            try {
                const [estudiante] = await db.query(
                    'SELECT nino_nombre as nombre FROM usuarios WHERE id = ?',
                    [estudianteId]
                );
                
                if (estudiante.length > 0) {
                    nombreEstudiante = estudiante[0].nombre;
                }
            } catch (error) {
                console.warn('⚠️ Error obteniendo nombre del estudiante:', error);
            }
            
            // Consulta para obtener tareas activas disponibles para el estudiante
            const [tareas] = await db.query(`
                SELECT 
                    t.*,
                    m.nombre as nombre_materia,
                    m.color as color_materia,
                    m.icono as icono_materia,
                    COALESCE(e.id_entrega, 0) as id_entrega,
                    e.estado as estado_entrega,
                    e.calificacion,
                    e.fecha_entrega,
                    DATEDIFF(t.fecha_cierre, NOW()) as dias_restantes,
                    CASE 
                        WHEN e.id_entrega IS NOT NULL THEN 'ENTREGADA'
                        WHEN NOW() > t.fecha_cierre THEN 'VENCIDA'
                        ELSE 'PENDIENTE'
                    END as estado_alumno
                FROM tareas t
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                LEFT JOIN entregas_tareas e ON t.id_tarea = e.id_tarea AND e.estudiante_id = ?
                WHERE t.activa = 1
                    AND (t.fecha_cierre >= NOW() OR t.permitir_entrega_tarde = 1)
                ORDER BY 
                    CASE 
                        WHEN NOW() > t.fecha_cierre THEN 1
                        WHEN dias_restantes <= 3 THEN 2
                        ELSE 3
                    END,
                    t.fecha_cierre ASC,
                    t.fecha_creacion DESC
            `, [estudianteId]);
            
            console.log(`📚 ${tareas.length} tareas disponibles para el estudiante`);
            
            res.json({
                ok: true,
                estudiante: nombreEstudiante,
                tareas: tareas
            });
        } catch (error) {
            console.error('❌ Error al listar tareas para estudiante:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al listar tareas'
            });
        }
    }

    // =====================================================
    // OBTENER MIS ENTREGAS
    // =====================================================
    async obtenerMisEntregas(req, res) {
        try {
            const estudianteId = req.user.id;
            
            console.log('📥 Obteniendo entregas del estudiante:', estudianteId);
            
            const [entregas] = await db.query(`
                SELECT 
                    e.*,
                    t.titulo,
                    t.fecha_cierre,
                    m.nombre as nombre_materia,
                    m.color as color_materia,
                    DATEDIFF(t.fecha_cierre, e.fecha_entrega) as dias_retraso,
                    CASE 
                        WHEN e.fecha_entrega > t.fecha_cierre THEN 1
                        ELSE 0
                    END as entregada_tarde
                FROM entregas_tareas e
                INNER JOIN tareas t ON e.id_tarea = t.id_tarea
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                WHERE e.estudiante_id = ?
                ORDER BY e.fecha_entrega DESC
            `, [estudianteId]);
            
            console.log(`📄 ${entregas.length} entregas encontradas`);
            
            res.json({
                ok: true,
                entregas: entregas
            });
        } catch (error) {
            console.error('❌ Error al obtener entregas:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al obtener entregas'
            });
        }
    }

    // =====================================================
    // ENTREGAR UNA TAREA
    // =====================================================
    async entregarTarea(req, res) {
        try {
            const estudianteId = req.user.id;
            const {
                id_tarea,
                comentario_alumno
            } = req.body;
            
            console.log('📤 Entregando tarea para estudiante:', estudianteId);
            console.log('📦 Datos recibidos:', { 
                id_tarea,
                comentario_alumno: comentario_alumno ? 'Sí' : 'No'
            });
            
            // Validaciones básicas
            if (!id_tarea) {
                return res.status(400).json({
                    ok: false,
                    error: 'ID de tarea es obligatorio'
                });
            }
            
            // Verificar si la tarea existe y está activa
            const [tarea] = await db.query(
                `SELECT * FROM tareas 
                 WHERE id_tarea = ? 
                 AND activa = 1
                 AND (fecha_cierre >= NOW() OR permitir_entrega_tarde = 1)`,
                [id_tarea]
            );
            
            if (!tarea.length) {
                return res.status(404).json({
                    ok: false,
                    error: 'Tarea no encontrada, inactiva o ya vencida'
                });
            }
            
            // Verificar si ya existe una entrega
            const [entregaExistente] = await db.query(
                'SELECT id_entrega FROM entregas_tareas WHERE id_tarea = ? AND estudiante_id = ?',
                [id_tarea, estudianteId]
            );
            
            if (entregaExistente.length > 0) {
                return res.status(400).json({
                    ok: false,
                    error: 'Ya has entregado esta tarea. Usa la opción de actualizar entrega.'
                });
            }
            
            // Ruta del archivo adjunto si se subió
            let archivoEntrega = null;
            if (req.file) {
                archivoEntrega = `uploads/entregas/${req.file.filename}`;
                console.log('📎 Archivo de entrega:', archivoEntrega);
            } else {
                return res.status(400).json({
                    ok: false,
                    error: 'Debes adjuntar un archivo para entregar la tarea'
                });
            }
            
            // Determinar estado basado en fecha
            const ahora = new Date();
            const fechaCierre = new Date(tarea[0].fecha_cierre);
            let estado = 'ENTREGADO';
            
            if (ahora > fechaCierre) {
                if (tarea[0].permitir_entrega_tarde) {
                    estado = 'ENTREGADO_TARDE';
                } else {
                    return res.status(400).json({
                        ok: false,
                        error: 'La tarea ya venció y no permite entrega tardía'
                    });
                }
            }
            
            // Insertar entrega en la base de datos
            const [result] = await db.query(
                `INSERT INTO entregas_tareas (
                    id_tarea, estudiante_id, archivo_entrega, 
                    comentario_alumno, estado, fecha_entrega, fecha_creacion
                ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [
                    id_tarea,
                    estudianteId,
                    archivoEntrega,
                    comentario_alumno ? comentario_alumno.trim() : null,
                    estado
                ]
            );
            
            console.log('✅ Entrega registrada con ID:', result.insertId);
            
            // Actualizar calificación trimestral si corresponde
            try {
                await this.actualizarCalificacionTrimestral(
                    estudianteId,
                    id_tarea,
                    0, // Calificación inicial 0
                    tarea[0].trimestre
                );
            } catch (error) {
                console.warn('⚠️ Error al actualizar calificación trimestral:', error);
            }
            
            res.json({
                ok: true,
                message: 'Tarea entregada exitosamente',
                id_entrega: result.insertId,
                estado: estado
            });
        } catch (error) {
            console.error('❌ Error al entregar tarea:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al entregar tarea'
            });
        }
    }

    // =====================================================
    // ACTUALIZAR ENTREGA
    // =====================================================
    async actualizarEntrega(req, res) {
        try {
            const estudianteId = req.user.id;
            const { id_entrega, comentario_alumno } = req.body;
            
            if (!id_entrega) {
                return res.status(400).json({
                    ok: false,
                    error: 'ID de entrega es requerido'
                });
            }
            
            console.log('🔄 Actualizando entrega ID:', id_entrega, 'estudiante:', estudianteId);
            
            // Verificar que la entrega exista y pertenezca al estudiante
            const [entregaExistente] = await db.query(
                `SELECT e.*, t.fecha_cierre, t.permitir_entrega_tarde 
                 FROM entregas_tareas e
                 INNER JOIN tareas t ON e.id_tarea = t.id_tarea
                 WHERE e.id_entrega = ? AND e.estudiante_id = ?`,
                [id_entrega, estudianteId]
            );
            
            if (!entregaExistente.length) {
                return res.status(404).json({
                    ok: false,
                    error: 'Entrega no encontrada o no tienes permisos'
                });
            }
            
            // Verificar si la tarea permite actualización (no calificada)
            if (entregaExistente[0].estado === 'REVISADO') {
                return res.status(400).json({
                    ok: false,
                    error: 'No puedes actualizar una entrega que ya ha sido calificada'
                });
            }
            
            // Manejar archivo adjunto
            let archivoEntrega = entregaExistente[0].archivo_entrega;
            
            if (req.file) {
                // Eliminar archivo anterior si existe
                if (archivoEntrega) {
                    const oldPath = path.join(__dirname, '../../../../', archivoEntrega);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                        console.log('🗑️ Archivo anterior eliminado:', oldPath);
                    }
                }
                
                archivoEntrega = `uploads/entregas/${req.file.filename}`;
                console.log('📎 Nuevo archivo de entrega:', archivoEntrega);
            }
            
            // Verificar si la entrega es tardía
            const ahora = new Date();
            const fechaCierre = new Date(entregaExistente[0].fecha_cierre);
            let estado = 'ENTREGADO';
            
            if (ahora > fechaCierre) {
                if (entregaExistente[0].permitir_entrega_tarde) {
                    estado = 'ENTREGADO_TARDE';
                } else {
                    return res.status(400).json({
                        ok: false,
                        error: 'La tarea ya venció y no permite entrega tardía'
                    });
                }
            }
            
            // Actualizar entrega
            await db.query(
                `UPDATE entregas_tareas SET
                    archivo_entrega = ?,
                    comentario_alumno = ?,
                    estado = ?,
                    fecha_entrega = CURRENT_TIMESTAMP,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_entrega = ?`,
                [
                    archivoEntrega,
                    comentario_alumno ? comentario_alumno.trim() : entregaExistente[0].comentario_alumno,
                    estado,
                    id_entrega
                ]
            );
            
            console.log('✅ Entrega actualizada exitosamente');
            
            res.json({
                ok: true,
                message: 'Entrega actualizada exitosamente',
                estado: estado
            });
        } catch (error) {
            console.error('❌ Error al actualizar entrega:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al actualizar entrega'
            });
        }
    }

    // =====================================================
    // OBTENER ESTADO DE UNA TAREA
    // =====================================================
    async obtenerEstadoTarea(req, res) {
        try {
            const { id_tarea } = req.params;
            const estudianteId = req.user.id;
            
            console.log('📊 Obteniendo estado de tarea ID:', id_tarea, 'estudiante:', estudianteId);
            
            const [estado] = await db.query(`
                SELECT 
                    t.*,
                    m.nombre as nombre_materia,
                    e.id_entrega,
                    e.estado as estado_entrega,
                    e.calificacion,
                    e.comentario_docente,
                    e.fecha_entrega,
                    DATEDIFF(t.fecha_cierre, NOW()) as dias_restantes,
                    CASE 
                        WHEN NOW() > t.fecha_cierre THEN 'VENCIDA'
                        WHEN e.id_entrega IS NOT NULL THEN 'ENTREGADA'
                        ELSE 'PENDIENTE'
                    END as estado_general
                FROM tareas t
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                LEFT JOIN entregas_tareas e ON t.id_tarea = e.id_tarea AND e.estudiante_id = ?
                WHERE t.id_tarea = ?
            `, [estudianteId, id_tarea]);
            
            if (!estado.length) {
                return res.status(404).json({
                    ok: false,
                    error: 'Tarea no encontrada'
                });
            }
            
            res.json({
                ok: true,
                estado: estado[0]
            });
        } catch (error) {
            console.error('❌ Error al obtener estado de tarea:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al obtener estado de tarea'
            });
        }
    }

    // =====================================================
    // OBTENER ESTADÍSTICAS DEL ESTUDIANTE
    // =====================================================
    async obtenerEstadisticasEstudiante(req, res) {
        try {
            const estudianteId = req.user.id;
            
            console.log('📈 Obteniendo estadísticas para estudiante:', estudianteId);
            
            // Estadísticas generales
            const [estadisticas] = await db.query(`
                SELECT 
                    COUNT(DISTINCT t.id_tarea) as total_tareas,
                    COUNT(DISTINCT e.id_entrega) as tareas_entregadas,
                    COUNT(DISTINCT CASE WHEN e.estado = 'REVISADO' THEN t.id_tarea END) as tareas_calificadas,
                    COUNT(DISTINCT CASE WHEN NOW() > t.fecha_cierre AND e.id_entrega IS NULL THEN t.id_tarea END) as tareas_vencidas,
                    COALESCE(AVG(e.calificacion), 0) as promedio_general,
                    COUNT(DISTINCT CASE WHEN e.calificacion >= 6 THEN t.id_tarea END) as tareas_aprobadas,
                    COUNT(DISTINCT CASE WHEN e.calificacion < 6 AND e.calificacion IS NOT NULL THEN t.id_tarea END) as tareas_reprobadas
                FROM tareas t
                LEFT JOIN entregas_tareas e ON t.id_tarea = e.id_tarea AND e.estudiante_id = ?
                WHERE t.activa = 1
            `, [estudianteId]);
            
            // Estadísticas por materia
            const [estadisticasPorMateria] = await db.query(`
                SELECT 
                    m.nombre as materia,
                    m.color as color_materia,
                    COUNT(DISTINCT t.id_tarea) as total_tareas_materia,
                    COUNT(DISTINCT e.id_entrega) as entregadas_materia,
                    COALESCE(AVG(e.calificacion), 0) as promedio_materia
                FROM materias m
                LEFT JOIN tareas t ON m.id_materia = t.id_materia AND t.activa = 1
                LEFT JOIN entregas_tareas e ON t.id_tarea = e.id_tarea AND e.estudiante_id = ?
                GROUP BY m.id_materia, m.nombre, m.color
                HAVING total_tareas_materia > 0
                ORDER BY total_tareas_materia DESC
            `, [estudianteId]);
            
            // Próximas tareas
            const [proximasTareas] = await db.query(`
                SELECT 
                    t.titulo,
                    m.nombre as materia,
                    t.fecha_cierre,
                    DATEDIFF(t.fecha_cierre, NOW()) as dias_restantes,
                    CASE 
                        WHEN e.id_entrega IS NOT NULL THEN 'ENTREGADA'
                        WHEN NOW() > t.fecha_cierre THEN 'VENCIDA'
                        WHEN DATEDIFF(t.fecha_cierre, NOW()) <= 3 THEN 'PRÓXIMA'
                        ELSE 'PENDIENTE'
                    END as estado
                FROM tareas t
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                LEFT JOIN entregas_tareas e ON t.id_tarea = e.id_tarea AND e.estudiante_id = ?
                WHERE t.activa = 1 
                    AND t.fecha_cierre >= NOW()
                    AND e.id_entrega IS NULL
                ORDER BY t.fecha_cierre ASC
                LIMIT 5
            `, [estudianteId]);
            
            res.json({
                ok: true,
                estadisticas: estadisticas[0] || {},
                por_materia: estadisticasPorMateria,
                proximas_tareas: proximasTareas
            });
        } catch (error) {
            console.error('❌ Error al obtener estadísticas:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al obtener estadísticas'
            });
        }
    }

    // =====================================================
    // OBTENER DETALLE DE UNA TAREA
    // =====================================================
    async obtenerDetalleTarea(req, res) {
        try {
            const { id_tarea } = req.params;
            const estudianteId = req.user.id;
            
            console.log('🔍 Obteniendo detalle de tarea ID:', id_tarea, 'estudiante:', estudianteId);
            
            const [tarea] = await db.query(`
                SELECT 
                    t.*,
                    m.nombre as nombre_materia,
                    m.color as color_materia,
                    m.icono as icono_materia,
                    m.descripcion as descripcion_materia,
                    e.id_entrega,
                    e.estado as estado_entrega,
                    e.calificacion,
                    e.comentario_docente,
                    e.comentario_alumno,
                    e.fecha_entrega,
                    e.archivo_entrega,
                    DATEDIFF(t.fecha_cierre, NOW()) as dias_restantes,
                    CASE 
                        WHEN NOW() > t.fecha_cierre THEN 'VENCIDA'
                        WHEN e.id_entrega IS NOT NULL THEN 'ENTREGADA'
                        ELSE 'PENDIENTE'
                    END as estado_general
                FROM tareas t
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                LEFT JOIN entregas_tareas e ON t.id_tarea = e.id_tarea AND e.estudiante_id = ?
                WHERE t.id_tarea = ?
            `, [estudianteId, id_tarea]);
            
            if (!tarea.length) {
                return res.status(404).json({
                    ok: false,
                    error: 'Tarea no encontrada'
                });
            }
            
            res.json({
                ok: true,
                tarea: tarea[0]
            });
        } catch (error) {
            console.error('❌ Error al obtener detalle de tarea:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al obtener detalle de tarea'
            });
        }
    }

    // =====================================================
    // DESCARGAR ARCHIVO DE TAREA
    // =====================================================
    async descargarArchivoTarea(req, res) {
        try {
            const { id_tarea } = req.params;
            const estudianteId = req.user.id;
            
            console.log('📥 Descargando archivo de tarea ID:', id_tarea, 'estudiante:', estudianteId);
            
            // Verificar que la tarea esté disponible para el estudiante
            const [tarea] = await db.query(
                'SELECT archivo_adjunto FROM tareas WHERE id_tarea = ? AND activa = 1',
                [id_tarea]
            );
            
            if (!tarea.length || !tarea[0].archivo_adjunto) {
                return res.status(404).json({
                    ok: false,
                    error: 'Archivo no encontrado o tarea no disponible'
                });
            }
            
            const filePath = path.join(__dirname, '../../../../', tarea[0].archivo_adjunto);
            
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    ok: false,
                    error: 'El archivo no existe en el servidor'
                });
            }
            
            const fileName = path.basename(filePath);
            console.log('✅ Enviando archivo de tarea:', fileName);
            
            res.download(filePath, fileName);
            
        } catch (error) {
            console.error('❌ Error al descargar archivo de tarea:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al descargar archivo de tarea'
            });
        }
    }

    // =====================================================
    // DESCARGAR ARCHIVO DE ENTREGA
    // =====================================================
    async descargarArchivoEntrega(req, res) {
        try {
            const { id_entrega } = req.params;
            const estudianteId = req.user.id;
            
            console.log('📥 Descargando archivo de entrega ID:', id_entrega, 'estudiante:', estudianteId);
            
            // Verificar que la entrega pertenezca al estudiante
            const [entrega] = await db.query(
                'SELECT archivo_entrega FROM entregas_tareas WHERE id_entrega = ? AND estudiante_id = ?',
                [id_entrega, estudianteId]
            );
            
            if (!entrega.length || !entrega[0].archivo_entrega) {
                return res.status(404).json({
                    ok: false,
                    error: 'Archivo no encontrado o no tienes permisos'
                });
            }
            
            const filePath = path.join(__dirname, '../../../../', entrega[0].archivo_entrega);
            
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    ok: false,
                    error: 'El archivo no existe en el servidor'
                });
            }
            
            const fileName = path.basename(filePath);
            console.log('✅ Enviando archivo de entrega:', fileName);
            
            res.download(filePath, fileName);
            
        } catch (error) {
            console.error('❌ Error al descargar archivo de entrega:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al descargar archivo de entrega'
            });
        }
    }

    // =====================================================
    // OBTENER TAREAS POR MATERIA
    // =====================================================
    async obtenerTareasPorMateria(req, res) {
        try {
            const { id_materia } = req.params;
            const estudianteId = req.user.id;
            
            console.log('📚 Obteniendo tareas por materia ID:', id_materia, 'estudiante:', estudianteId);
            
            const [tareas] = await db.query(`
                SELECT 
                    t.*,
                    m.nombre as nombre_materia,
                    e.id_entrega,
                    e.estado as estado_entrega,
                    e.calificacion,
                    DATEDIFF(t.fecha_cierre, NOW()) as dias_restantes
                FROM tareas t
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                LEFT JOIN entregas_tareas e ON t.id_tarea = e.id_tarea AND e.estudiante_id = ?
                WHERE t.id_materia = ? AND t.activa = 1
                ORDER BY t.fecha_cierre ASC
            `, [estudianteId, id_materia]);
            
            console.log(`📋 ${tareas.length} tareas encontradas para la materia`);
            
            res.json({
                ok: true,
                tareas: tareas
            });
        } catch (error) {
            console.error('❌ Error al obtener tareas por materia:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al obtener tareas por materia'
            });
        }
    }

    // =====================================================
    // OBTENER TAREAS POR ESTADO
    // =====================================================
    async obtenerTareasPorEstado(req, res) {
        try {
            const { estado } = req.params; // 'pendientes', 'entregadas', 'calificadas', 'vencidas'
            const estudianteId = req.user.id;
            
            console.log('🔘 Obteniendo tareas por estado:', estado, 'estudiante:', estudianteId);
            
            let query = '';
            let params = [estudianteId];
            
            switch (estado) {
                case 'pendientes':
                    query = `
                        SELECT t.*, m.nombre as nombre_materia
                        FROM tareas t
                        LEFT JOIN materias m ON t.id_materia = m.id_materia
                        LEFT JOIN entregas_tareas e ON t.id_tarea = e.id_tarea AND e.estudiante_id = ?
                        WHERE t.activa = 1 
                            AND e.id_entrega IS NULL 
                            AND t.fecha_cierre >= NOW()
                    `;
                    break;
                    
                case 'entregadas':
                    query = `
                        SELECT t.*, m.nombre as nombre_materia, e.estado, e.fecha_entrega
                        FROM tareas t
                        LEFT JOIN materias m ON t.id_materia = m.id_materia
                        INNER JOIN entregas_tareas e ON t.id_tarea = e.id_tarea AND e.estudiante_id = ?
                        WHERE t.activa = 1
                    `;
                    break;
                    
                case 'calificadas':
                    query = `
                        SELECT t.*, m.nombre as nombre_materia, e.calificacion, e.comentario_docente
                        FROM tareas t
                        LEFT JOIN materias m ON t.id_materia = m.id_materia
                        INNER JOIN entregas_tareas e ON t.id_tarea = e.id_tarea AND e.estudiante_id = ?
                        WHERE t.activa = 1 AND e.estado = 'REVISADO'
                    `;
                    break;
                    
                case 'vencidas':
                    query = `
                        SELECT t.*, m.nombre as nombre_materia
                        FROM tareas t
                        LEFT JOIN materias m ON t.id_materia = m.id_materia
                        LEFT JOIN entregas_tareas e ON t.id_tarea = e.id_tarea AND e.estudiante_id = ?
                        WHERE t.activa = 1 
                            AND e.id_entrega IS NULL 
                            AND NOW() > t.fecha_cierre
                    `;
                    break;
                    
                default:
                    return res.status(400).json({
                        ok: false,
                        error: 'Estado no válido'
                    });
            }
            
            const [tareas] = await db.query(query, params);
            
            console.log(`📋 ${tareas.length} tareas ${estado} encontradas`);
            
            res.json({
                ok: true,
                tareas: tareas
            });
        } catch (error) {
            console.error('❌ Error al obtener tareas por estado:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al obtener tareas por estado'
            });
        }
    }

    // =====================================================
    // OBTENER TAREAS VENCIDAS
    // =====================================================
    async obtenerTareasVencidas(req, res) {
        try {
            const estudianteId = req.user.id;
            
            console.log('⏰ Obteniendo tareas vencidas para estudiante:', estudianteId);
            
            const [tareas] = await db.query(`
                SELECT 
                    t.*,
                    m.nombre as nombre_materia,
                    DATEDIFF(NOW(), t.fecha_cierre) as dias_vencida
                FROM tareas t
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                LEFT JOIN entregas_tareas e ON t.id_tarea = e.id_tarea AND e.estudiante_id = ?
                WHERE t.activa = 1 
                    AND e.id_entrega IS NULL 
                    AND NOW() > t.fecha_cierre
                    AND t.fecha_cierre > DATE_SUB(NOW(), INTERVAL 30 DAY)
                ORDER BY t.fecha_cierre DESC
            `, [estudianteId]);
            
            console.log(`⚠️ ${tareas.length} tareas vencidas encontradas`);
            
            res.json({
                ok: true,
                tareas: tareas
            });
        } catch (error) {
            console.error('❌ Error al obtener tareas vencidas:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al obtener tareas vencidas'
            });
        }
    }

    // =====================================================
    // OBTENER TAREAS PRÓXIMAS A VENCER
    // =====================================================
    async obtenerTareasProximasAVencer(req, res) {
        try {
            const estudianteId = req.user.id;
            const ahora = new Date();
            const en3Dias = new Date();
            en3Dias.setDate(ahora.getDate() + 3);
            
            const ahoraStr = ahora.toISOString().slice(0, 19).replace('T', ' ');
            const en3DiasStr = en3Dias.toISOString().slice(0, 19).replace('T', ' ');
            
            console.log('🚨 Obteniendo tareas próximas a vencer para estudiante:', estudianteId);
            
            const [tareas] = await db.query(`
                SELECT 
                    t.*,
                    m.nombre as nombre_materia,
                    DATEDIFF(t.fecha_cierre, NOW()) as dias_restantes
                FROM tareas t
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                LEFT JOIN entregas_tareas e ON t.id_tarea = e.id_tarea AND e.estudiante_id = ?
                WHERE t.activa = 1 
                    AND e.id_entrega IS NULL 
                    AND t.fecha_cierre >= ? 
                    AND t.fecha_cierre <= ?
                ORDER BY t.fecha_cierre ASC
                LIMIT 10
            `, [estudianteId, ahoraStr, en3DiasStr]);
            
            console.log(`⏳ ${tareas.length} tareas próximas a vencer encontradas`);
            
            res.json({
                ok: true,
                tareas: tareas
            });
        } catch (error) {
            console.error('❌ Error al obtener tareas próximas a vencer:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al obtener tareas próximas a vencer'
            });
        }
    }

    // =====================================================
    // OBTENER TAREAS NO ENTREGADAS
    // =====================================================
    async obtenerTareasNoEntregadas(req, res) {
        try {
            const estudianteId = req.user.id;
            
            console.log('📭 Obteniendo tareas no entregadas para estudiante:', estudianteId);
            
            const [tareas] = await db.query(`
                SELECT 
                    t.*,
                    m.nombre as nombre_materia,
                    CASE 
                        WHEN NOW() > t.fecha_cierre THEN 'VENCIDA'
                        ELSE 'PENDIENTE'
                    END as estado
                FROM tareas t
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                LEFT JOIN entregas_tareas e ON t.id_tarea = e.id_tarea AND e.estudiante_id = ?
                WHERE t.activa = 1 
                    AND e.id_entrega IS NULL
                ORDER BY t.fecha_cierre ASC
            `, [estudianteId]);
            
            console.log(`📭 ${tareas.length} tareas no entregadas encontradas`);
            
            res.json({
                ok: true,
                tareas: tareas
            });
        } catch (error) {
            console.error('❌ Error al obtener tareas no entregadas:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al obtener tareas no entregadas'
            });
        }
    }

    // =====================================================
    // OBTENER HISTORIAL DE CALIFICACIONES
    // =====================================================
    async obtenerHistorialCalificaciones(req, res) {
        try {
            const estudianteId = req.user.id;
            
            console.log('📊 Obteniendo historial de calificaciones para estudiante:', estudianteId);
            
            const [calificaciones] = await db.query(`
                SELECT 
                    e.*,
                    t.titulo,
                    t.fecha_cierre,
                    m.nombre as nombre_materia,
                    m.color as color_materia,
                    CASE 
                        WHEN e.calificacion >= 9 THEN 'EXCELENTE'
                        WHEN e.calificacion >= 7 THEN 'BUENO'
                        WHEN e.calificacion >= 6 THEN 'SUFICIENTE'
                        WHEN e.calificacion IS NULL THEN 'SIN_CALIFICAR'
                        ELSE 'INSUFICIENTE'
                    END as nivel_desempeno
                FROM entregas_tareas e
                INNER JOIN tareas t ON e.id_tarea = t.id_tarea
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                WHERE e.estudiante_id = ? 
                    AND e.estado = 'REVISADO'
                ORDER BY e.fecha_entrega DESC
            `, [estudianteId]);
            
            // Calificaciones por materia
            const [calificacionesPorMateria] = await db.query(`
                SELECT 
                    m.nombre as materia,
                    m.color as color_materia,
                    COUNT(e.id_entrega) as total_tareas,
                    COALESCE(AVG(e.calificacion), 0) as promedio_materia,
                    MIN(e.calificacion) as minima_calificacion,
                    MAX(e.calificacion) as maxima_calificacion
                FROM entregas_tareas e
                INNER JOIN tareas t ON e.id_tarea = t.id_tarea
                INNER JOIN materias m ON t.id_materia = m.id_materia
                WHERE e.estudiante_id = ? 
                    AND e.estado = 'REVISADO'
                GROUP BY m.id_materia, m.nombre, m.color
                ORDER BY promedio_materia DESC
            `, [estudianteId]);
            
            console.log(`📈 ${calificaciones.length} calificaciones encontradas`);
            
            res.json({
                ok: true,
                calificaciones: calificaciones,
                por_materia: calificacionesPorMateria
            });
        } catch (error) {
            console.error('❌ Error al obtener historial de calificaciones:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al obtener historial de calificaciones'
            });
        }
    }

    // =====================================================
    // ACTUALIZAR CALIFICACIÓN TRIMESTRAL (Función auxiliar)
    // =====================================================
    async actualizarCalificacionTrimestral(estudianteId, tareaId, calificacion, trimestre = null) {
        try {
            console.log('📊 Actualizando calificación trimestral para estudiante:', {
                estudianteId,
                tareaId,
                calificacion,
                trimestre
            });
            
            // Si no se proporciona trimestre, obtenerlo de la tarea
            if (!trimestre) {
                const [tarea] = await db.query(
                    'SELECT trimestre FROM tareas WHERE id_tarea = ?',
                    [tareaId]
                );
                
                if (!tarea.length) {
                    console.warn('⚠️ Tarea no encontrada para actualización trimestral');
                    return;
                }
                
                trimestre = tarea[0].trimestre;
            }
            
            // Convertir trimestre a número entero
            const trimestreId = parseInt(trimestre);
            
            if (isNaN(trimestreId) || trimestreId < 1 || trimestreId > 3) {
                console.warn('⚠️ Trimestre inválido:', trimestre);
                return;
            }
            
            console.log('🔢 Trimestre convertido a número:', trimestreId);
            
            // Verificar si ya existe una calificación trimestral
            const [calificacionExistente] = await db.query(
                'SELECT * FROM calificaciones_trimestre WHERE estudiante_id = ? AND tarea_id = ?',
                [estudianteId, tareaId]
            );
            
            if (calificacionExistente.length > 0) {
                // Actualizar calificación existente
                await db.query(
                    `UPDATE calificaciones_trimestre SET
                        porcentaje = ?,
                        trimestre_id = ?,
                        fecha_actualizacion = CURRENT_TIMESTAMP
                    WHERE id = ?`,
                    [calificacion, trimestreId, calificacionExistente[0].id]
                );
                console.log('✅ Calificación trimestral actualizada (existente)');
            } else {
                // Crear nueva calificación trimestral
                await db.query(
                    `INSERT INTO calificaciones_trimestre 
                    (estudiante_id, tarea_id, trimestre_id, porcentaje, fecha_creacion, fecha_actualizacion) 
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                    [estudianteId, tareaId, trimestreId, calificacion]
                );
                console.log('✅ Nueva calificación trimestral creada');
            }
        } catch (error) {
            console.error('❌ Error al actualizar calificación trimestral:', error);
        }
    }
}

// =====================================================
// 🚀 EXPORTAR CONTROLADOR Y MIDDLEWARES
// =====================================================

// Exportar middlewares integrados
module.exports = {
    // Controlador con métodos protegidos
    TareasController: {
        listarTareas: TareasController.applyMiddleware(new TareasController().listarTareas),
        obtenerMisEntregas: TareasController.applyMiddleware(new TareasController().obtenerMisEntregas),
        entregarTarea: TareasController.applyMiddleware(new TareasController().entregarTarea),
        actualizarEntrega: TareasController.applyMiddleware(new TareasController().actualizarEntrega),
        obtenerEstadoTarea: TareasController.applyMiddleware(new TareasController().obtenerEstadoTarea),
        obtenerEstadisticasEstudiante: TareasController.applyMiddleware(new TareasController().obtenerEstadisticasEstudiante),
        obtenerDetalleTarea: TareasController.applyMiddleware(new TareasController().obtenerDetalleTarea),
        descargarArchivoTarea: TareasController.applyMiddleware(new TareasController().descargarArchivoTarea),
        descargarArchivoEntrega: TareasController.applyMiddleware(new TareasController().descargarArchivoEntrega),
        obtenerTareasPorMateria: TareasController.applyMiddleware(new TareasController().obtenerTareasPorMateria),
        obtenerTareasPorEstado: TareasController.applyMiddleware(new TareasController().obtenerTareasPorEstado),
        obtenerTareasVencidas: TareasController.applyMiddleware(new TareasController().obtenerTareasVencidas),
        obtenerTareasProximasAVencer: TareasController.applyMiddleware(new TareasController().obtenerTareasProximasAVencer),
        obtenerTareasNoEntregadas: TareasController.applyMiddleware(new TareasController().obtenerTareasNoEntregadas),
        obtenerHistorialCalificaciones: TareasController.applyMiddleware(new TareasController().obtenerHistorialCalificaciones)
    },
    
    // Middleware de upload
    uploadMiddleware: uploadMiddleware,
    
    // Middlewares de autenticación
    verificarAutenticacionEstudiante,
    verificarEstudiante
};