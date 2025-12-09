const db = require('../../../config/dbConfig'); // <-- apunta a tu dbConfig.js


const calificacionesController = {
    // Obtener todas las calificaciones
    obtenerCalificaciones: async (req, res) => {
        try {
            const query = `
                SELECT 
                    u.id AS estudiante_id,
                    u.nino_nombre AS alumno_nombre,
                    COALESCE(tr.nombre, 'Sin trimestre') AS trimestre_nombre,
                    m.nombre AS materia_nombre,
                    COALESCE(pc.promedio_materia, 0) AS promedio_materia,
                    t.titulo AS titulo_tarea,
                    COALESCE(et.calificacion, 0) AS calificacion,
                    DATE_FORMAT(et.fecha_entrega, '%Y-%m-%d') AS fecha_entrega,
                    t.fecha_cierre AS fecha_limite,
                    CASE 
                        WHEN et.calificacion IS NOT NULL THEN 'Calificada'
                        WHEN et.fecha_entrega IS NOT NULL THEN 'Entregada'
                        ELSE 'Pendiente'
                    END AS estado_tarea
                FROM usuarios u
                LEFT JOIN promedios_calificaciones pc ON u.id = pc.estudiante_id
                LEFT JOIN trimestres tr ON pc.trimestre = tr.id
                LEFT JOIN materias m ON pc.id_materia = m.id_materia
                LEFT JOIN tareas t ON m.id_materia = t.id_materia
                LEFT JOIN entregas_tareas et ON u.id = et.estudiante_id AND t.id_tarea = et.id_tarea
                WHERE u.nino_nombre IS NOT NULL
                    AND (et.id_entrega IS NOT NULL OR pc.id_promedio IS NOT NULL)
                ORDER BY u.nino_nombre, tr.nombre, m.nombre
            `;

            const [results] = await db.query(query);
            
            // Estructurar los datos
            const calificacionesEstructuradas = {};
            
            results.forEach(row => {
                if (!calificacionesEstructuradas[row.estudiante_id]) {
                    calificacionesEstructuradas[row.estudiante_id] = {
                        estudiante_id: row.estudiante_id,
                        alumno_nombre: row.alumno_nombre,
                        trimestres: {}
                    };
                }
                
                const estudiante = calificacionesEstructuradas[row.estudiante_id];
                
                // Agregar trimestre
                if (!estudiante.trimestres[row.trimestre_nombre]) {
                    estudiante.trimestres[row.trimestre_nombre] = {
                        nombre: row.trimestre_nombre,
                        materias: {}
                    };
                }
                
                const trimestre = estudiante.trimestres[row.trimestre_nombre];
                
                // Agregar materia
                if (row.materia_nombre && !trimestre.materias[row.materia_nombre]) {
                    trimestre.materias[row.materia_nombre] = {
                        nombre: row.materia_nombre,
                        promedio: row.promedio_materia,
                        tareas: []
                    };
                }
                
                // Agregar tarea
                if (row.titulo_tarea && row.materia_nombre) {
                    const materia = trimestre.materias[row.materia_nombre];
                    materia.tareas.push({
                        titulo: row.titulo_tarea,
                        calificacion: row.calificacion,
                        fecha_entrega: row.fecha_entrega,
                        fecha_limite: row.fecha_limite,
                        estado: row.estado_tarea
                    });
                }
            });
            
            // Convertir a array
            const response = Object.values(calificacionesEstructuradas).map(estudiante => ({
                ...estudiante,
                trimestres: Object.values(estudiante.trimestres).map(trimestre => ({
                    ...trimestre,
                    materias: Object.values(trimestre.materias)
                }))
            }));
            
            res.json({
                success: true,
                data: response,
                total: response.length,
                message: 'Calificaciones obtenidas exitosamente'
            });
            
        } catch (error) {
            console.error('Error en obtenerCalificaciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las calificaciones',
                error: error.message
            });
        }
    },

    // Obtener calificaciones por estudiante
    obtenerCalificacionesPorEstudiante: async (req, res) => {
        try {
            const { id } = req.params;
            
            const query = `
                SELECT 
                    u.id AS estudiante_id,
                    u.nino_nombre AS alumno_nombre,
                    COALESCE(tr.nombre, 'Sin trimestre') AS trimestre_nombre,
                    m.nombre AS materia_nombre,
                    COALESCE(pc.promedio_materia, 0) AS promedio_materia,
                    t.titulo AS titulo_tarea,
                    COALESCE(et.calificacion, 0) AS calificacion,
                    DATE_FORMAT(et.fecha_entrega, '%Y-%m-%d') AS fecha_entrega,
                    t.fecha_cierre AS fecha_limite,
                    CASE 
                        WHEN et.calificacion IS NOT NULL THEN 'Calificada'
                        WHEN et.fecha_entrega IS NOT NULL THEN 'Entregada'
                        ELSE 'Pendiente'
                    END AS estado_tarea
                FROM usuarios u
                LEFT JOIN promedios_calificaciones pc ON u.id = pc.estudiante_id
                LEFT JOIN trimestres tr ON pc.trimestre = tr.id
                LEFT JOIN materias m ON pc.id_materia = m.id_materia
                LEFT JOIN tareas t ON m.id_materia = t.id_materia
                LEFT JOIN entregas_tareas et ON u.id = et.estudiante_id AND t.id_tarea = et.id_tarea
                WHERE u.id = ? 
                    AND u.nino_nombre IS NOT NULL
                    AND (et.id_entrega IS NOT NULL OR pc.id_promedio IS NOT NULL)
                ORDER BY tr.nombre, m.nombre, t.fecha_cierre
            `;

            const [results] = await db.query(query, [id]);
            
            if (results.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        estudiante_id: id,
                        alumno_nombre: '',
                        trimestres: []
                    },
                    message: 'No se encontraron calificaciones para este estudiante'
                });
            }
            
            // Estructurar los datos
            const calificacionesEstructuradas = {
                estudiante_id: results[0].estudiante_id,
                alumno_nombre: results[0].alumno_nombre,
                trimestres: {}
            };
            
            results.forEach(row => {
                // Agregar trimestre
                if (!calificacionesEstructuradas.trimestres[row.trimestre_nombre]) {
                    calificacionesEstructuradas.trimestres[row.trimestre_nombre] = {
                        nombre: row.trimestre_nombre,
                        materias: {}
                    };
                }
                
                const trimestre = calificacionesEstructuradas.trimestres[row.trimestre_nombre];
                
                // Agregar materia
                if (row.materia_nombre && !trimestre.materias[row.materia_nombre]) {
                    trimestre.materias[row.materia_nombre] = {
                        nombre: row.materia_nombre,
                        promedio: row.promedio_materia,
                        tareas: []
                    };
                }
                
                // Agregar tarea
                if (row.titulo_tarea && row.materia_nombre) {
                    const materia = trimestre.materias[row.materia_nombre];
                    materia.tareas.push({
                        titulo: row.titulo_tarea,
                        calificacion: row.calificacion,
                        fecha_entrega: row.fecha_entrega,
                        fecha_limite: row.fecha_limite,
                        estado: row.estado_tarea
                    });
                }
            });
            
            // Convertir a array
            calificacionesEstructuradas.trimestres = Object.values(calificacionesEstructuradas.trimestres).map(trimestre => ({
                ...trimestre,
                materias: Object.values(trimestre.materias)
            }));
            
            res.json({
                success: true,
                data: calificacionesEstructuradas,
                message: 'Calificaciones del estudiante obtenidas exitosamente'
            });
            
        } catch (error) {
            console.error('Error en obtenerCalificacionesPorEstudiante:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las calificaciones del estudiante',
                error: error.message
            });
        }
    },

    // Actualizar calificación de tarea
    actualizarCalificacion: async (req, res) => {
        try {
            const { estudiante_id, tarea_id, calificacion } = req.body;
            
            if (!estudiante_id || !tarea_id || calificacion === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos requeridos: estudiante_id, tarea_id, calificacion'
                });
            }
            
            // Verificar si la entrega existe
            const [entregaExistente] = await db.query(
                'SELECT * FROM entregas_tareas WHERE estudiante_id = ? AND id_tarea = ?',
                [estudiante_id, tarea_id]
            );
            
            if (entregaExistente.length > 0) {
                // Actualizar entrega existente
                await db.query(
                    'UPDATE entregas_tareas SET calificacion = ?, fecha_calificacion = NOW() WHERE estudiante_id = ? AND id_tarea = ?',
                    [calificacion, estudiante_id, tarea_id]
                );
            } else {
                // Insertar nueva entrega
                await db.query(
                    'INSERT INTO entregas_tareas (estudiante_id, id_tarea, calificacion, fecha_calificacion, fecha_entrega) VALUES (?, ?, ?, NOW(), NOW())',
                    [estudiante_id, tarea_id, calificacion]
                );
            }
            
            res.json({
                success: true,
                message: 'Calificación actualizada exitosamente'
            });
            
        } catch (error) {
            console.error('Error en actualizarCalificacion:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar la calificación',
                error: error.message
            });
        }
    },

    // Obtener resumen de calificaciones
    obtenerResumenCalificaciones: async (req, res) => {
        try {
            const query = `
                SELECT 
                    u.id AS estudiante_id,
                    u.nino_nombre AS alumno_nombre,
                    COUNT(DISTINCT et.id_entrega) AS total_tareas,
                    ROUND(AVG(et.calificacion), 2) AS promedio_general,
                    MAX(et.fecha_entrega) AS ultima_entrega
                FROM usuarios u
                LEFT JOIN entregas_tareas et ON u.id = et.estudiante_id
                WHERE u.nino_nombre IS NOT NULL
                    AND et.calificacion IS NOT NULL
                GROUP BY u.id, u.nino_nombre
                ORDER BY u.nino_nombre
            `;

            const [results] = await db.query(query);
            
            res.json({
                success: true,
                data: results,
                total: results.length,
                message: 'Resumen de calificaciones obtenido exitosamente'
            });
            
        } catch (error) {
            console.error('Error en obtenerResumenCalificaciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el resumen de calificaciones',
                error: error.message
            });
        }
    }
};

module.exports = calificacionesController;