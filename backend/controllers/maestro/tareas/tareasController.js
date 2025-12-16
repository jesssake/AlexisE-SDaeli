const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Cargar dbConfig directamente (sin rutas absolutas)
const db = require('../../../config/dbConfig');
console.log('✅ tareasController: dbConfig cargado exitosamente');

// =====================================================
// 📦 MIDDLEWARES INTEGRADOS - CORREGIDO PARA DESARROLLO
// =====================================================

// Middleware de autenticación SIMPLIFICADO - ACEPTA TOKENS SIMPLES
const verificarAutenticacion = (req, res, next) => {
    console.log('🔐 MIDDLEWARE TAREAS - Verificación simplificada');
    
    // Mostrar todos los headers para depuración
    console.log('📋 Headers recibidos:', {
        authorization: req.headers.authorization,
        'x-user-id': req.headers['x-user-id'],
        'x-user-rol': req.headers['x-user-rol']
    });
    
    // ✅ PARA DESARROLLO: Siempre permitir acceso
    // Verificar si hay token de desarrollo simple
    const authHeader = req.headers.authorization || '';
    
    if (authHeader.includes('token-desarrollo-12345') || 
        authHeader.includes('eyJhbGciOiJ') || 
        authHeader.startsWith('Bearer ')) {
        
        console.log('✅ Token aceptado (modo desarrollo)');
        
        // Usar userId de headers o por defecto
        const userId = req.headers['x-user-id'] || '1';
        const userRol = req.headers['x-user-rol'] || 'maestro';
        
        req.user = {
            id: parseInt(userId),
            rol: userRol,
            nombre: 'Maestro Demo'
        };
        
        console.log('👤 Usuario configurado:', req.user);
        return next();
    }
    
    // Si no hay token, igual permitir acceso para desarrollo
    console.warn('⚠️ No hay token válido, pero permitiendo acceso (modo desarrollo)');
    
    req.user = {
        id: 1,
        rol: 'maestro',
        nombre: 'Maestro Demo'
    };
    
    console.log('👤 Usuario por defecto:', req.user);
    next();
};

// Middleware para verificar que sea maestro
const verificarMaestro = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            ok: false,
            error: 'Usuario no autenticado'
        });
    }
    
    // Verificar si el usuario es maestro o admin
    const rol = req.user.rol?.toLowerCase();
    if (rol === 'maestro' || rol === 'admin' || rol === 'profesor' || rol === 'superadmin') {
        return next();
    }
    
    return res.status(403).json({
        ok: false,
        error: 'Acceso denegado. Solo maestros pueden acceder a esta funcionalidad.'
    });
};

// =====================================================
// ⚙️ CONFIGURACIÓN MULTER
// =====================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../../../uploads/tareas');
        
        // Crear directorio si no existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'tarea-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/zip',
            'application/x-rar-compressed'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'), false);
        }
    }
}).single('archivo_adjunto');

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
// 🎯 CONTROLADOR DE TAREAS
// =====================================================
class TareasController {
    
    // Aplicar middleware de autenticación y verificación de maestro a todos los métodos
    static applyMiddleware(handler) {
        return async (req, res) => {
            try {
                // Aplicar autenticación
                const authResult = await new Promise((resolve) => {
                    verificarAutenticacion(req, res, resolve);
                });
                
                if (authResult) return; // Si hubo error, ya se envió respuesta
                
                // Aplicar verificación de maestro
                const maestroResult = await new Promise((resolve) => {
                    verificarMaestro(req, res, resolve);
                });
                
                if (maestroResult) return; // Si hubo error, ya se envió respuesta
                
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
    // LISTAR TODAS LAS TAREAS DEL MAESTRO
    // =====================================================
    async listarTareas(req, res) {
        try {
            const maestroId = req.user.id;
            
            console.log('👤 Maestro ID:', maestroId);
            
            // Obtener el nombre del maestro
            let nombreMaestro = 'Maestro';
            
            // Intentar obtener de administradores
            try {
                const [maestro] = await db.query(
                    'SELECT admin_nombre as nombre_completo FROM administradores WHERE id = ?',
                    [maestroId]
                );
                
                if (maestro.length > 0) {
                    nombreMaestro = maestro[0].nombre_completo;
                } else {
                    // Intentar obtener de usuarios
                    const [usuario] = await db.query(
                        'SELECT tutor_nombre as nombre_completo FROM usuarios WHERE id = ? AND rol = "maestro"',
                        [maestroId]
                    );
                    if (usuario.length > 0) {
                        nombreMaestro = usuario[0].nombre_completo;
                    }
                }
            } catch (error) {
                console.warn('⚠️ Error obteniendo nombre del maestro:', error);
            }
            
            // Consulta para obtener tareas
            const [tareas] = await db.query(`
                SELECT 
                    t.*,
                    m.nombre as nombre_materia,
                    m.color as color_materia,
                    m.icono as icono_materia,
                    COALESCE(e.total_entregas, 0) as total_entregas,
                    COALESCE(e.entregas_revisadas, 0) as entregas_revisadas,
                    COALESCE(e.entregas_pendientes, 0) as entregas_pendientes
                FROM tareas t
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                LEFT JOIN (
                    SELECT 
                        id_tarea, 
                        COUNT(*) as total_entregas,
                        SUM(CASE WHEN estado = 'REVISADO' THEN 1 ELSE 0 END) as entregas_revisadas,
                        SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) as entregas_pendientes
                    FROM entregas_tareas 
                    GROUP BY id_tarea
                ) e ON t.id_tarea = e.id_tarea
                WHERE t.created_by = ?
                ORDER BY t.fecha_creacion DESC
            `, [maestroId]);
            
            console.log(`📚 ${tareas.length} tareas encontradas para el maestro`);
            
            res.json({
                ok: true,
                maestro: nombreMaestro,
                tareas: tareas
            });
        } catch (error) {
            console.error('❌ Error al listar tareas:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al listar tareas'
            });
        }
    }

    // =====================================================
    // CREAR NUEVA TAREA
    // =====================================================
    async crearTarea(req, res) {
        try {
            const maestroId = req.user.id;
            const {
                titulo,
                instrucciones,
                fecha_cierre,
                permitir_entrega_tarde,
                activa,
                rubrica,
                id_materia,
                trimestre
            } = req.body;
            
            console.log('📝 Creando tarea para maestro:', maestroId);
            console.log('📦 Datos recibidos:', { 
                titulo, 
                id_materia,
                fecha_cierre,
                trimestre 
            });
            
            // Validaciones básicas
            if (!titulo || !fecha_cierre) {
                return res.status(400).json({
                    ok: false,
                    error: 'Título y fecha límite son obligatorios'
                });
            }
            
            if (!id_materia) {
                return res.status(400).json({
                    ok: false,
                    error: 'Debes seleccionar una materia'
                });
            }
            
            // Verificar si la materia existe
            const [materia] = await db.query(
                'SELECT id_materia FROM materias WHERE id_materia = ?',
                [id_materia]
            );
            
            if (!materia.length) {
                return res.status(400).json({
                    ok: false,
                    error: 'La materia seleccionada no existe'
                });
            }
            
            // Validar fecha
            const fechaCierre = new Date(fecha_cierre);
            if (isNaN(fechaCierre.getTime())) {
                return res.status(400).json({
                    ok: false,
                    error: 'Fecha límite inválida'
                });
            }
            
            // Validar que la fecha no sea en el pasado
            const ahora = new Date();
            if (fechaCierre < ahora) {
                return res.status(400).json({
                    ok: false,
                    error: 'La fecha límite no puede ser en el pasado'
                });
            }
            
            // Ruta del archivo adjunto si se subió
            let archivoAdjunto = null;
            if (req.file) {
                archivoAdjunto = `uploads/tareas/${req.file.filename}`;
                console.log('📎 Archivo adjunto:', archivoAdjunto);
            }
            
            // Insertar tarea en la base de datos
            const [result] = await db.query(
                `INSERT INTO tareas (
                    titulo, instrucciones, fecha_cierre, 
                    permitir_entrega_tarde, activa, rubrica, 
                    archivo_adjunto, created_by, id_materia, trimestre,
                    fecha_creacion, fecha_actualizacion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [
                    titulo.trim(),
                    instrucciones ? instrucciones.trim() : '',
                    fecha_cierre,
                    permitir_entrega_tarde ? 1 : 0,
                    activa ? 1 : 0,
                    rubrica ? rubrica.trim() : '',
                    archivoAdjunto,
                    maestroId,
                    id_materia,
                    trimestre || '1'
                ]
            );
            
            console.log('✅ Tarea creada con ID:', result.insertId);
            
            res.json({
                ok: true,
                message: 'Tarea creada exitosamente',
                id_tarea: result.insertId
            });
        } catch (error) {
            console.error('❌ Error al crear tarea:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al crear tarea'
            });
        }
    }

    // =====================================================
    // ACTUALIZAR TAREA
    // =====================================================
    async actualizarTarea(req, res) {
        try {
            const maestroId = req.user.id;
            const { id_tarea } = req.body;
            
            if (!id_tarea) {
                return res.status(400).json({
                    ok: false,
                    error: 'ID de tarea es requerido'
                });
            }
            
            console.log('🔄 Actualizando tarea ID:', id_tarea, 'para maestro:', maestroId);
            
            // Verificar que la tarea exista y pertenezca al maestro
            const [tareaExistente] = await db.query(
                'SELECT * FROM tareas WHERE id_tarea = ? AND created_by = ?',
                [id_tarea, maestroId]
            );
            
            if (!tareaExistente.length) {
                return res.status(404).json({
                    ok: false,
                    error: 'Tarea no encontrada o no tienes permisos'
                });
            }
            
            const {
                titulo,
                instrucciones,
                fecha_cierre,
                permitir_entrega_tarde,
                activa,
                rubrica,
                id_materia,
                trimestre
            } = req.body;
            
            // Verificar si la materia existe
            if (id_materia) {
                const [materia] = await db.query(
                    'SELECT id_materia FROM materias WHERE id_materia = ?',
                    [id_materia]
                );
                
                if (!materia.length) {
                    return res.status(400).json({
                        ok: false,
                        error: 'La materia seleccionada no existe'
                    });
                }
            }
            
            // Validar fecha si se está actualizando
            if (fecha_cierre) {
                const fechaCierre = new Date(fecha_cierre);
                if (isNaN(fechaCierre.getTime())) {
                    return res.status(400).json({
                        ok: false,
                        error: 'Fecha límite inválida'
                    });
                }
                
                // Validar que la fecha no sea en el pasado
                const ahora = new Date();
                if (fechaCierre < ahora) {
                    return res.status(400).json({
                        ok: false,
                        error: 'La fecha límite no puede ser en el pasado'
                    });
                }
            }
            
            // Manejar archivo adjunto
            let archivoAdjunto = tareaExistente[0].archivo_adjunto;
            
            if (req.file) {
                // Eliminar archivo anterior si existe
                if (archivoAdjunto) {
                    const oldPath = path.join(__dirname, '../../../../', archivoAdjunto);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                        console.log('🗑️ Archivo anterior eliminado:', oldPath);
                    }
                }
                
                archivoAdjunto = `uploads/tareas/${req.file.filename}`;
                console.log('📎 Nuevo archivo adjunto:', archivoAdjunto);
            } else if (req.body.eliminar_archivo === 'true') {
                // Eliminar archivo si se solicita
                if (archivoAdjunto) {
                    const oldPath = path.join(__dirname, '../../../../', archivoAdjunto);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                        console.log('🗑️ Archivo eliminado por solicitud:', oldPath);
                    }
                    archivoAdjunto = null;
                }
            }
            
            // Actualizar tarea
            await db.query(
                `UPDATE tareas SET
                    titulo = ?,
                    instrucciones = ?,
                    fecha_cierre = ?,
                    permitir_entrega_tarde = ?,
                    activa = ?,
                    rubrica = ?,
                    archivo_adjunto = ?,
                    id_materia = ?,
                    trimestre = ?,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_tarea = ?`,
                [
                    titulo ? titulo.trim() : tareaExistente[0].titulo,
                    instrucciones !== undefined ? instrucciones.trim() : tareaExistente[0].instrucciones,
                    fecha_cierre || tareaExistente[0].fecha_cierre,
                    permitir_entrega_tarde !== undefined ? (permitir_entrega_tarde ? 1 : 0) : tareaExistente[0].permitir_entrega_tarde,
                    activa !== undefined ? (activa ? 1 : 0) : tareaExistente[0].activa,
                    rubrica !== undefined ? rubrica.trim() : tareaExistente[0].rubrica,
                    archivoAdjunto,
                    id_materia || tareaExistente[0].id_materia,
                    trimestre || tareaExistente[0].trimestre,
                    id_tarea
                ]
            );
            
            console.log('✅ Tarea actualizada exitosamente');
            
            res.json({
                ok: true,
                message: 'Tarea actualizada exitosamente'
            });
        } catch (error) {
            console.error('❌ Error al actualizar tarea:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al actualizar tarea'
            });
        }
    }

    // =====================================================
    // ELIMINAR TAREA
    // =====================================================
    async eliminarTarea(req, res) {
        try {
            const maestroId = req.user.id;
            const { id_tarea } = req.body;
            
            if (!id_tarea) {
                return res.status(400).json({
                    ok: false,
                    error: 'ID de tarea es requerido'
                });
            }
            
            console.log('🗑️ Eliminando tarea ID:', id_tarea, 'para maestro:', maestroId);
            
            // Verificar que la tarea exista y pertenezca al maestro
            const [tarea] = await db.query(
                'SELECT archivo_adjunto FROM tareas WHERE id_tarea = ? AND created_by = ?',
                [id_tarea, maestroId]
            );
            
            if (!tarea.length) {
                return res.status(404).json({
                    ok: false,
                    error: 'Tarea no encontrada o no tienes permisos'
                });
            }
            
            // Eliminar archivo adjunto si existe
            if (tarea[0].archivo_adjunto) {
                const filePath = path.join(__dirname, '../../../../', tarea[0].archivo_adjunto);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('🗑️ Archivo adjunto eliminado:', filePath);
                }
            }
            
            // Eliminar entregas asociadas primero
            await db.query('DELETE FROM entregas_tareas WHERE id_tarea = ?', [id_tarea]);
            
            // Eliminar calificaciones trimestrales asociadas
            await db.query('DELETE FROM calificaciones_trimestre WHERE tarea_id = ?', [id_tarea]);
            
            // Eliminar la tarea
            await db.query('DELETE FROM tareas WHERE id_tarea = ?', [id_tarea]);
            
            console.log('✅ Tarea eliminada exitosamente');
            
            res.json({
                ok: true,
                message: 'Tarea eliminada exitosamente'
            });
        } catch (error) {
            console.error('❌ Error al eliminar tarea:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al eliminar tarea'
            });
        }
    }

    // =====================================================
    // OBTENER ENTREGAS DE UNA TAREA
    // =====================================================
    async obtenerEntregas(req, res) {
        try {
            const { id_tarea } = req.query;
            const maestroId = req.user.id;
            
            if (!id_tarea) {
                return res.status(400).json({
                    ok: false,
                    error: 'ID de tarea es requerido'
                });
            }
            
            console.log('📥 Obteniendo entregas para tarea ID:', id_tarea, 'maestro:', maestroId);
            
            // Verificar que la tarea pertenezca al maestro
            const [tarea] = await db.query(
                'SELECT id_tarea FROM tareas WHERE id_tarea = ? AND created_by = ?',
                [id_tarea, maestroId]
            );
            
            if (!tarea.length) {
                return res.status(403).json({
                    ok: false,
                    error: 'No tienes permiso para ver estas entregas'
                });
            }
            
            // Obtener entregas con información de estudiantes
            const [entregas] = await db.query(`
                SELECT 
                    et.*,
                    u.nino_nombre as nombre_alumno,
                    u.tutor_nombre as nombre_tutor,
                    u.tutor_email as email_tutor,
                    u.tutor_telefono as telefono_tutor
                FROM entregas_tareas et
                INNER JOIN usuarios u ON et.estudiante_id = u.id
                WHERE et.id_tarea = ?
                ORDER BY 
                    CASE WHEN et.estado = 'PENDIENTE' THEN 1
                        WHEN et.estado = 'ENTREGADO' THEN 2
                        WHEN et.estado = 'REVISADO' THEN 3
                        ELSE 4 END,
                    et.fecha_entrega DESC
            `, [id_tarea]);
            
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
    // CALIFICAR ENTREGA
    // =====================================================
    async calificarEntrega(req, res) {
        try {
            const maestroId = req.user.id;
            const { id_entrega, calificacion, comentario_docente } = req.body;
            
            console.log('📝 Calificando entrega:', { 
                id_entrega, 
                calificacion, 
                comentario_docente,
                maestroId 
            });
            
            if (!id_entrega) {
                return res.status(400).json({
                    ok: false,
                    error: 'ID de entrega es requerido'
                });
            }
            
            // Verificar que la entrega pertenezca a una tarea del maestro
            const [entrega] = await db.query(`
                SELECT et.*, t.created_by, t.trimestre 
                FROM entregas_tareas et
                INNER JOIN tareas t ON et.id_tarea = t.id_tarea
                WHERE et.id_entrega = ?
            `, [id_entrega]);
            
            if (!entrega.length) {
                return res.status(404).json({
                    ok: false,
                    error: 'Entrega no encontrada'
                });
            }
            
            if (entrega[0].created_by !== maestroId) {
                return res.status(403).json({
                    ok: false,
                    error: 'No tienes permiso para calificar esta entrega'
                });
            }
            
            // Validación de calificación
            let calificacionFinal = null;
            
            if (calificacion !== undefined && 
                calificacion !== null && 
                calificacion !== '' && 
                calificacion !== 'null' && 
                calificacion !== 'undefined') {
                
                // Convertir a número
                calificacionFinal = parseFloat(calificacion);
                
                // Validar si es número válido
                if (isNaN(calificacionFinal)) {
                    return res.status(400).json({
                        ok: false,
                        error: 'La calificación debe ser un número válido'
                    });
                }
                
                // Validar rango
                if (calificacionFinal < 0 || calificacionFinal > 10) {
                    return res.status(400).json({
                        ok: false,
                        error: 'La calificación debe ser un número entre 0 y 10'
                    });
                }
                
                // Redondear a 1 decimal
                calificacionFinal = Math.round(calificacionFinal * 10) / 10;
            }
            
            // Determinar estado basado en calificación
            let estado = entrega[0].estado;
            if (calificacionFinal !== null) {
                estado = 'REVISADO';
            } else if (estado === 'REVISADO' && calificacionFinal === null) {
                estado = 'ENTREGADO';
            }
            
            console.log('💾 Actualizando entrega con:', {
                calificacionFinal,
                estado,
                comentario_docente: comentario_docente || null
            });
            
            // Actualizar entrega
            await db.query(
                `UPDATE entregas_tareas SET
                    calificacion = ?,
                    comentario_docente = ?,
                    estado = ?,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_entrega = ?`,
                [
                    calificacionFinal,
                    comentario_docente ? comentario_docente.trim() : null,
                    estado,
                    id_entrega
                ]
            );
            
            // Actualizar calificación trimestral si hay calificación
            if (calificacionFinal !== null) {
                try {
                    await this.actualizarCalificacionTrimestral(
                        entrega[0].estudiante_id,
                        entrega[0].id_tarea,
                        calificacionFinal,
                        entrega[0].trimestre
                    );
                    console.log('✅ Calificación trimestral actualizada');
                } catch (error) {
                    console.warn('⚠️ Error al actualizar calificación trimestral (continuando):', error);
                    // Continuar aunque falle la actualización trimestral
                }
            }
            
            res.json({
                ok: true,
                message: 'Calificación guardada exitosamente'
            });
        } catch (error) {
            console.error('❌ Error al calificar entrega:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al calificar entrega'
            });
        }
    }

    // =====================================================
    // ACTUALIZAR CALIFICACIÓN TRIMESTRAL
    // =====================================================
    async actualizarCalificacionTrimestral(estudianteId, tareaId, calificacion, trimestre = null) {
        try {
            console.log('📊 Actualizando calificación trimestral:', {
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

    // =====================================================
    // OBTENER ESTADÍSTICAS DE TAREAS
    // =====================================================
    async obtenerEstadisticas(req, res) {
        try {
            const maestroId = req.user.id;
            
            console.log('📊 Obteniendo estadísticas para maestro:', maestroId);
            
            const [estadisticas] = await db.query(`
                SELECT 
                    COUNT(*) as total_tareas,
                    SUM(CASE WHEN activa = 1 THEN 1 ELSE 0 END) as tareas_activas,
                    SUM(CASE WHEN permitir_entrega_tarde = 1 THEN 1 ELSE 0 END) as permiten_tarde,
                    COALESCE(SUM(e.total_entregas), 0) as total_entregas_general,
                    COALESCE(AVG(e.promedio_calificaciones), 0) as promedio_calificaciones,
                    COUNT(DISTINCT id_materia) as materias_utilizadas
                FROM tareas t
                LEFT JOIN (
                    SELECT 
                        id_tarea, 
                        COUNT(*) as total_entregas,
                        AVG(calificacion) as promedio_calificaciones
                    FROM entregas_tareas 
                    WHERE calificacion IS NOT NULL
                    GROUP BY id_tarea
                ) e ON t.id_tarea = e.id_tarea
                WHERE t.created_by = ?
            `, [maestroId]);
            
            // Estadísticas por trimestre
            const [estadisticasPorTrimestre] = await db.query(`
                SELECT 
                    trimestre,
                    COUNT(*) as total_tareas,
                    SUM(CASE WHEN activa = 1 THEN 1 ELSE 0 END) as tareas_activas,
                    COALESCE(SUM(e.total_entregas), 0) as total_entregas
                FROM tareas t
                LEFT JOIN (
                    SELECT id_tarea, COUNT(*) as total_entregas 
                    FROM entregas_tareas 
                    GROUP BY id_tarea
                ) e ON t.id_tarea = e.id_tarea
                WHERE t.created_by = ?
                GROUP BY trimestre
                ORDER BY trimestre
            `, [maestroId]);
            
            // Estadísticas por materia
            const [estadisticasPorMateria] = await db.query(`
                SELECT 
                    m.nombre as materia,
                    m.color as color_materia,
                    COUNT(t.id_tarea) as total_tareas,
                    COALESCE(SUM(e.total_entregas), 0) as total_entregas
                FROM materias m
                LEFT JOIN tareas t ON m.id_materia = t.id_materia AND t.created_by = ?
                LEFT JOIN (
                    SELECT id_tarea, COUNT(*) as total_entregas 
                    FROM entregas_tareas 
                    GROUP BY id_tarea
                ) e ON t.id_tarea = e.id_tarea
                WHERE m.id_materia IN (SELECT DISTINCT id_materia FROM tareas WHERE created_by = ?)
                GROUP BY m.id_materia, m.nombre, m.color
                ORDER BY total_tareas DESC
            `, [maestroId, maestroId]);
            
            res.json({
                ok: true,
                estadisticas: estadisticas[0] || {},
                por_trimestre: estadisticasPorTrimestre,
                por_materia: estadisticasPorMateria
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
    // OBTENER DETALLE DE UNA TAREA ESPECÍFICA
    // =====================================================
    async obtenerDetalleTarea(req, res) {
        try {
            const { id_tarea } = req.params;
            const maestroId = req.user.id;
            
            console.log('🔍 Obteniendo detalle de tarea ID:', id_tarea, 'maestro:', maestroId);
            
            const [tarea] = await db.query(`
                SELECT 
                    t.*,
                    m.nombre as nombre_materia,
                    m.color as color_materia,
                    m.icono as icono_materia,
                    m.descripcion as descripcion_materia,
                    a.admin_nombre as nombre_creador
                FROM tareas t
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                LEFT JOIN administradores a ON t.created_by = a.id
                WHERE t.id_tarea = ? AND t.created_by = ?
            `, [id_tarea, maestroId]);
            
            if (!tarea.length) {
                return res.status(404).json({
                    ok: false,
                    error: 'Tarea no encontrada o no tienes permisos'
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
    // DESCARGAR ARCHIVO ADJUNTO
    // =====================================================
    async descargarArchivo(req, res) {
        try {
            const { id_tarea } = req.params;
            const maestroId = req.user.id;
            
            console.log('📥 Descargando archivo de tarea ID:', id_tarea, 'maestro:', maestroId);
            
            const [tarea] = await db.query(
                'SELECT archivo_adjunto FROM tareas WHERE id_tarea = ? AND created_by = ?',
                [id_tarea, maestroId]
            );
            
            if (!tarea.length || !tarea[0].archivo_adjunto) {
                return res.status(404).json({
                    ok: false,
                    error: 'Archivo no encontrado'
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
            console.log('✅ Enviando archivo:', fileName);
            
            res.download(filePath, fileName);
            
        } catch (error) {
            console.error('❌ Error al descargar archivo:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al descargar archivo'
            });
        }
    }

    // =====================================================
    // OBTENER TAREAS POR MATERIA
    // =====================================================
    async obtenerTareasPorMateria(req, res) {
        try {
            const { id_materia } = req.params;
            const maestroId = req.user.id;
            
            console.log('📚 Obteniendo tareas por materia ID:', id_materia, 'maestro:', maestroId);
            
            const [tareas] = await db.query(`
                SELECT 
                    t.*,
                    m.nombre as nombre_materia,
                    COALESCE(e.total_entregas, 0) as total_entregas
                FROM tareas t
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                LEFT JOIN (
                    SELECT id_tarea, COUNT(*) as total_entregas 
                    FROM entregas_tareas 
                    GROUP BY id_tarea
                ) e ON t.id_tarea = e.id_tarea
                WHERE t.created_by = ? AND t.id_materia = ?
                ORDER BY t.fecha_cierre DESC
            `, [maestroId, id_materia]);
            
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
            const { estado } = req.params; // 'activas' o 'inactivas'
            const maestroId = req.user.id;
            
            console.log('🔘 Obteniendo tareas por estado:', estado, 'maestro:', maestroId);
            
            const esActiva = estado === 'activas' ? 1 : 0;
            
            const [tareas] = await db.query(`
                SELECT 
                    t.*,
                    m.nombre as nombre_materia,
                    COALESCE(e.total_entregas, 0) as total_entregas
                FROM tareas t
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                LEFT JOIN (
                    SELECT id_tarea, COUNT(*) as total_entregas 
                    FROM entregas_tareas 
                    GROUP BY id_tarea
                ) e ON t.id_tarea = e.id_tarea
                WHERE t.created_by = ? AND t.activa = ?
                ORDER BY t.fecha_cierre DESC
            `, [maestroId, esActiva]);
            
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
            const maestroId = req.user.id;
            const ahora = new Date().toISOString().slice(0, 19).replace('T', ' ');
            
            console.log('⏰ Obteniendo tareas vencidas para maestro:', maestroId);
            
            const [tareas] = await db.query(`
                SELECT 
                    t.*,
                    m.nombre as nombre_materia,
                    COALESCE(e.total_entregas, 0) as total_entregas,
                    DATEDIFF(t.fecha_cierre, NOW()) as dias_restantes
                FROM tareas t
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                LEFT JOIN (
                    SELECT id_tarea, COUNT(*) as total_entregas 
                    FROM entregas_tareas 
                    GROUP BY id_tarea
                ) e ON t.id_tarea = e.id_tarea
                WHERE t.created_by = ? 
                    AND t.activa = 1 
                    AND t.fecha_cierre < ?
                    AND t.fecha_cierre > DATE_SUB(?, INTERVAL 30 DAY)
                ORDER BY t.fecha_cierre DESC
            `, [maestroId, ahora, ahora]);
            
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
            const maestroId = req.user.id;
            const ahora = new Date();
            const en3Dias = new Date();
            en3Dias.setDate(ahora.getDate() + 3);
            
            const ahoraStr = ahora.toISOString().slice(0, 19).replace('T', ' ');
            const en3DiasStr = en3Dias.toISOString().slice(0, 19).replace('T', ' ');
            
            console.log('🚨 Obteniendo tareas próximas a vencer para maestro:', maestroId);
            
            const [tareas] = await db.query(`
                SELECT 
                    t.*,
                    m.nombre as nombre_materia,
                    COALESCE(e.total_entregas, 0) as total_entregas,
                    DATEDIFF(t.fecha_cierre, NOW()) as dias_restantes
                FROM tareas t
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                LEFT JOIN (
                    SELECT id_tarea, COUNT(*) as total_entregas 
                    FROM entregas_tareas 
                    GROUP BY id_tarea
                ) e ON t.id_tarea = e.id_tarea
                WHERE t.created_by = ? 
                    AND t.activa = 1 
                    AND t.fecha_cierre >= ?
                    AND t.fecha_cierre <= ?
                ORDER BY t.fecha_cierre ASC
                LIMIT 10
            `, [maestroId, ahoraStr, en3DiasStr]);
            
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
    // CAMBIAR ESTADO DE TAREA (ACTIVAR/DESACTIVAR)
    // =====================================================
    async cambiarEstadoTarea(req, res) {
        try {
            const maestroId = req.user.id;
            const { id_tarea, nuevo_estado } = req.body; // nuevo_estado: true/false
            
            console.log('🔄 Cambiando estado de tarea ID:', id_tarea, 'a:', nuevo_estado);
            
            if (!id_tarea || nuevo_estado === undefined) {
                return res.status(400).json({
                    ok: false,
                    error: 'ID de tarea y nuevo estado son requeridos'
                });
            }
            
            // Verificar que la tarea pertenezca al maestro
            const [tarea] = await db.query(
                'SELECT id_tarea FROM tareas WHERE id_tarea = ? AND created_by = ?',
                [id_tarea, maestroId]
            );
            
            if (!tarea.length) {
                return res.status(404).json({
                    ok: false,
                    error: 'Tarea no encontrada o no tienes permisos'
                });
            }
            
            // Actualizar estado
            await db.query(
                `UPDATE tareas SET
                    activa = ?,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_tarea = ?`,
                [nuevo_estado ? 1 : 0, id_tarea]
            );
            
            console.log('✅ Estado de tarea cambiado exitosamente');
            
            res.json({
                ok: true,
                message: `Tarea ${nuevo_estado ? 'activada' : 'desactivada'} exitosamente`
            });
        } catch (error) {
            console.error('❌ Error al cambiar estado de tarea:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al cambiar estado de tarea'
            });
        }
    }

    // =====================================================
    // OBTENER RESUMEN DE CALIFICACIONES POR TAREA
    // =====================================================
    async obtenerResumenCalificaciones(req, res) {
        try {
            const { id_tarea } = req.params;
            const maestroId = req.user.id;
            
            console.log('📊 Obteniendo resumen de calificaciones para tarea ID:', id_tarea);
            
            // Verificar que la tarea pertenezca al maestro
            const [tarea] = await db.query(
                'SELECT id_tarea FROM tareas WHERE id_tarea = ? AND created_by = ?',
                [id_tarea, maestroId]
            );
            
            if (!tarea.length) {
                return res.status(404).json({
                    ok: false,
                    error: 'Tarea no encontrada o no tienes permisos'
                });
            }
            
            const [resumen] = await db.query(`
                SELECT 
                    COUNT(*) as total_entregas,
                    SUM(CASE WHEN calificacion IS NOT NULL THEN 1 ELSE 0 END) as calificadas,
                    SUM(CASE WHEN calificacion IS NULL THEN 1 ELSE 0 END) as sin_calificar,
                    MIN(calificacion) as minima_calificacion,
                    MAX(calificacion) as maxima_calificacion,
                    AVG(calificacion) as promedio_calificacion,
                    SUM(CASE WHEN calificacion >= 6 THEN 1 ELSE 0 END) as aprobadas,
                    SUM(CASE WHEN calificacion < 6 AND calificacion IS NOT NULL THEN 1 ELSE 0 END) as reprobadas
                FROM entregas_tareas
                WHERE id_tarea = ?
            `, [id_tarea]);
            
            const [distribucionCalificaciones] = await db.query(`
                SELECT 
                    CASE 
                        WHEN calificacion >= 9 THEN '9-10 (Excelente)'
                        WHEN calificacion >= 7 THEN '7-8.9 (Bueno)'
                        WHEN calificacion >= 6 THEN '6-6.9 (Suficiente)'
                        WHEN calificacion < 6 THEN '0-5.9 (Insuficiente)'
                        ELSE 'Sin calificar'
                    END as rango,
                    COUNT(*) as cantidad
                FROM entregas_tareas
                WHERE id_tarea = ?
                GROUP BY 
                    CASE 
                        WHEN calificacion >= 9 THEN '9-10 (Excelente)'
                        WHEN calificacion >= 7 THEN '7-8.9 (Bueno)'
                        WHEN calificacion >= 6 THEN '6-6.9 (Suficiente)'
                        WHEN calificacion < 6 THEN '0-5.9 (Insuficiente)'
                        ELSE 'Sin calificar'
                    END
                ORDER BY 
                    CASE 
                        WHEN rango = '9-10 (Excelente)' THEN 1
                        WHEN rango = '7-8.9 (Bueno)' THEN 2
                        WHEN rango = '6-6.9 (Suficiente)' THEN 3
                        WHEN rango = '0-5.9 (Insuficiente)' THEN 4
                        ELSE 5
                    END
            `, [id_tarea]);
            
            console.log('✅ Resumen de calificaciones obtenido');
            
            res.json({
                ok: true,
                resumen: resumen[0] || {},
                distribucion: distribucionCalificaciones
            });
        } catch (error) {
            console.error('❌ Error al obtener resumen de calificaciones:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al obtener resumen de calificaciones'
            });
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
        crearTarea: TareasController.applyMiddleware(new TareasController().crearTarea),
        actualizarTarea: TareasController.applyMiddleware(new TareasController().actualizarTarea),
        eliminarTarea: TareasController.applyMiddleware(new TareasController().eliminarTarea),
        obtenerEntregas: TareasController.applyMiddleware(new TareasController().obtenerEntregas),
        calificarEntrega: TareasController.applyMiddleware(new TareasController().calificarEntrega),
        obtenerEstadisticas: TareasController.applyMiddleware(new TareasController().obtenerEstadisticas),
        obtenerDetalleTarea: TareasController.applyMiddleware(new TareasController().obtenerDetalleTarea),
        descargarArchivo: TareasController.applyMiddleware(new TareasController().descargarArchivo),
        obtenerTareasPorMateria: TareasController.applyMiddleware(new TareasController().obtenerTareasPorMateria),
        obtenerTareasPorEstado: TareasController.applyMiddleware(new TareasController().obtenerTareasPorEstado),
        obtenerTareasVencidas: TareasController.applyMiddleware(new TareasController().obtenerTareasVencidas),
        obtenerTareasProximasAVencer: TareasController.applyMiddleware(new TareasController().obtenerTareasProximasAVencer),
        cambiarEstadoTarea: TareasController.applyMiddleware(new TareasController().cambiarEstadoTarea),
        obtenerResumenCalificaciones: TareasController.applyMiddleware(new TareasController().obtenerResumenCalificaciones)
    },
    
    // Middleware de upload
    uploadMiddleware: uploadMiddleware,
    
    // Middlewares de autenticación para usar en otras rutas si es necesario
    verificarAutenticacion,
    verificarMaestro
};