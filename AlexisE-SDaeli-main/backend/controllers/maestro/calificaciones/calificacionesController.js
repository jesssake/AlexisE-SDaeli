const db = require('../../../config/dbConfig');

const calificacionesController = {
    // Obtener todas las calificaciones - VERSIÓN CORREGIDA
    obtenerCalificaciones: async (req, res) => {
        try {
            console.log('📊 Obteniendo calificaciones...');
            
            // Consulta sin la columna comentarios
            const query = `
                SELECT 
                    u.id AS estudiante_id,
                    u.nino_nombre AS alumno_nombre,
                    COALESCE(tr.nombre, 'Trimestre 1') AS trimestre_nombre,
                    m.nombre AS materia_nombre,
                    t.id_tarea,
                    t.titulo AS titulo_tarea,
                    et.calificacion,
                    DATE_FORMAT(et.fecha_entrega, '%Y-%m-%d') AS fecha_entrega,
                    t.fecha_cierre AS fecha_limite,
                    CASE 
                        WHEN et.calificacion IS NOT NULL THEN 'Calificada'
                        WHEN et.fecha_entrega IS NOT NULL THEN 'Entregada'
                        ELSE 'Pendiente'
                    END AS estado_tarea
                FROM usuarios u
                LEFT JOIN entregas_tareas et ON u.id = et.estudiante_id
                LEFT JOIN tareas t ON et.id_tarea = t.id_tarea
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                LEFT JOIN trimestres tr ON t.trimestre = tr.id
                WHERE u.nino_nombre IS NOT NULL
                    AND u.nino_nombre != ''
                    AND u.nino_nombre != 'null'
                    AND u.rol = 'tutor'
                ORDER BY u.nino_nombre, m.nombre, t.fecha_cierre
            `;

            const [results] = await db.query(query);
            
            console.log(`📊 Resultados encontrados: ${results.length} filas`);
            
            // Estructurar los datos
            const estudiantesMap = new Map();
            
            results.forEach(row => {
                if (!row.estudiante_id) return;
                
                if (!estudiantesMap.has(row.estudiante_id)) {
                    estudiantesMap.set(row.estudiante_id, {
                        estudiante_id: row.estudiante_id,
                        alumno_nombre: row.alumno_nombre,
                        trimestres: {}
                    });
                }
                
                const estudiante = estudiantesMap.get(row.estudiante_id);
                const trimestreNombre = row.trimestre_nombre || 'Sin trimestre';
                
                if (!estudiante.trimestres[trimestreNombre]) {
                    estudiante.trimestres[trimestreNombre] = {
                        nombre: trimestreNombre,
                        materias: {}
                    };
                }
                
                const trimestre = estudiante.trimestres[trimestreNombre];
                const materiaNombre = row.materia_nombre || 'Sin materia';
                
                if (!trimestre.materias[materiaNombre]) {
                    trimestre.materias[materiaNombre] = {
                        nombre: materiaNombre,
                        promedio: 0,
                        tareas: []
                    };
                }
                
                const materia = trimestre.materias[materiaNombre];
                
                if (row.titulo_tarea) {
                    materia.tareas.push({
                        id_tarea: row.id_tarea,
                        titulo: row.titulo_tarea,
                        calificacion: row.calificacion,
                        fecha_entrega: row.fecha_entrega,
                        fecha_limite: row.fecha_limite,
                        estado: row.estado_tarea,
                        comentarios: ''
                    });
                    
                    // Calcular promedio de la materia
                    const calificacionesValidas = materia.tareas
                        .filter(t => t.calificacion !== null && t.calificacion !== undefined)
                        .map(t => t.calificacion);
                    
                    if (calificacionesValidas.length > 0) {
                        materia.promedio = calificacionesValidas.reduce((a, b) => a + b, 0) / calificacionesValidas.length;
                    }
                }
            });
            
            // Convertir a array final
            const response = Array.from(estudiantesMap.values()).map(estudiante => ({
                ...estudiante,
                trimestres: Object.values(estudiante.trimestres).map(trimestre => ({
                    ...trimestre,
                    materias: Object.values(trimestre.materias)
                }))
            }));
            
            // Contar estudiantes con tareas
            const estudiantesConTareas = response.filter(est => {
                let tieneTareas = false;
                est.trimestres?.forEach(t => {
                    t.materias?.forEach(m => {
                        if (m.tareas?.length > 0) tieneTareas = true;
                    });
                });
                return tieneTareas;
            });
            
            console.log(`✅ Estudiantes totales: ${response.length}`);
            console.log(`✅ Estudiantes con tareas: ${estudiantesConTareas.length}`);
            
            res.json({
                success: true,
                data: response,
                total: response.length,
                message: `Calificaciones obtenidas exitosamente (${response.length} estudiantes)`
            });
            
        } catch (error) {
            console.error('❌ Error en obtenerCalificaciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las calificaciones',
                error: error.message
            });
        }
    },

    // Obtener calificaciones por estudiante - VERSIÓN CORREGIDA
    obtenerCalificacionesPorEstudiante: async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`📊 Obteniendo calificaciones para estudiante ID: ${id}`);
            
            const query = `
                SELECT 
                    u.id AS estudiante_id,
                    u.nino_nombre AS alumno_nombre,
                    COALESCE(tr.nombre, 'Trimestre 1') AS trimestre_nombre,
                    m.nombre AS materia_nombre,
                    t.id_tarea,
                    t.titulo AS titulo_tarea,
                    et.calificacion,
                    DATE_FORMAT(et.fecha_entrega, '%Y-%m-%d') AS fecha_entrega,
                    t.fecha_cierre AS fecha_limite,
                    CASE 
                        WHEN et.calificacion IS NOT NULL THEN 'Calificada'
                        WHEN et.fecha_entrega IS NOT NULL THEN 'Entregada'
                        ELSE 'Pendiente'
                    END AS estado_tarea
                FROM usuarios u
                LEFT JOIN entregas_tareas et ON u.id = et.estudiante_id
                LEFT JOIN tareas t ON et.id_tarea = t.id_tarea
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                LEFT JOIN trimestres tr ON t.trimestre = tr.id
                WHERE u.id = ?
                    AND u.nino_nombre IS NOT NULL
                ORDER BY m.nombre, t.fecha_cierre
            `;

            const [results] = await db.query(query, [id]);
            
            // Verificar si el estudiante existe
            if (results.length === 0) {
                const [estudiante] = await db.query(
                    'SELECT id, nino_nombre FROM usuarios WHERE id = ?',
                    [id]
                );
                return res.json({
                    success: true,
                    data: {
                        estudiante_id: parseInt(id),
                        alumno_nombre: estudiante[0]?.nino_nombre || 'Estudiante',
                        trimestres: []
                    },
                    message: 'No se encontraron calificaciones para este estudiante'
                });
            }
            
            // Estructurar los datos
            const estudiante = {
                estudiante_id: results[0].estudiante_id,
                alumno_nombre: results[0].alumno_nombre,
                trimestres: {}
            };
            
            results.forEach(row => {
                const trimestreNombre = row.trimestre_nombre || 'Sin trimestre';
                
                if (!estudiante.trimestres[trimestreNombre]) {
                    estudiante.trimestres[trimestreNombre] = {
                        nombre: trimestreNombre,
                        materias: {}
                    };
                }
                
                const trimestre = estudiante.trimestres[trimestreNombre];
                const materiaNombre = row.materia_nombre || 'Sin materia';
                
                if (!trimestre.materias[materiaNombre]) {
                    trimestre.materias[materiaNombre] = {
                        nombre: materiaNombre,
                        promedio: 0,
                        tareas: []
                    };
                }
                
                const materia = trimestre.materias[materiaNombre];
                
                if (row.titulo_tarea) {
                    materia.tareas.push({
                        id_tarea: row.id_tarea,
                        titulo: row.titulo_tarea,
                        calificacion: row.calificacion,
                        fecha_entrega: row.fecha_entrega,
                        fecha_limite: row.fecha_limite,
                        estado: row.estado_tarea,
                        comentarios: ''
                    });
                    
                    // Calcular promedio de la materia
                    const calificacionesValidas = materia.tareas
                        .filter(t => t.calificacion !== null && t.calificacion !== undefined)
                        .map(t => t.calificacion);
                    
                    if (calificacionesValidas.length > 0) {
                        materia.promedio = calificacionesValidas.reduce((a, b) => a + b, 0) / calificacionesValidas.length;
                    }
                }
            });
            
            // Convertir a array
            estudiante.trimestres = Object.values(estudiante.trimestres).map(trimestre => ({
                ...trimestre,
                materias: Object.values(trimestre.materias)
            }));
            
            console.log(`✅ Calificaciones del estudiante ${estudiante.alumno_nombre} obtenidas`);
            
            res.json({
                success: true,
                data: estudiante,
                message: 'Calificaciones del estudiante obtenidas exitosamente'
            });
            
        } catch (error) {
            console.error('❌ Error en obtenerCalificacionesPorEstudiante:', error);
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
            
            if (calificacion < 0 || calificacion > 10) {
                return res.status(400).json({
                    success: false,
                    message: 'La calificación debe estar entre 0 y 10'
                });
            }
            
            console.log(`📝 Actualizando calificación: Estudiante ${estudiante_id}, Tarea ${tarea_id}, Calificación ${calificacion}`);
            
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
                console.log(`✅ Calificación actualizada`);
            } else {
                // Insertar nueva entrega
                await db.query(
                    'INSERT INTO entregas_tareas (estudiante_id, id_tarea, calificacion, fecha_calificacion, fecha_entrega) VALUES (?, ?, ?, NOW(), NOW())',
                    [estudiante_id, tarea_id, calificacion]
                );
                console.log(`✅ Nueva entrega creada con calificación`);
            }
            
            res.json({
                success: true,
                message: 'Calificación actualizada exitosamente'
            });
            
        } catch (error) {
            console.error('❌ Error en actualizarCalificacion:', error);
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
                    ROUND(COALESCE(AVG(et.calificacion), 0), 2) AS promedio_general,
                    COUNT(DISTINCT CASE WHEN et.calificacion IS NOT NULL THEN et.id_entrega END) AS tareas_calificadas,
                    COUNT(DISTINCT CASE WHEN et.calificacion IS NULL AND et.fecha_entrega IS NOT NULL THEN et.id_entrega END) AS tareas_entregadas
                FROM usuarios u
                LEFT JOIN entregas_tareas et ON u.id = et.estudiante_id
                WHERE u.nino_nombre IS NOT NULL
                    AND u.nino_nombre != ''
                    AND u.nino_nombre != 'null'
                    AND u.rol = 'tutor'
                GROUP BY u.id, u.nino_nombre
                ORDER BY u.nino_nombre
            `;

            const [results] = await db.query(query);
            
            console.log(`✅ Resumen de calificaciones: ${results.length} estudiantes`);
            
            res.json({
                success: true,
                data: results,
                total: results.length,
                message: 'Resumen de calificaciones obtenido exitosamente'
            });
            
        } catch (error) {
            console.error('❌ Error en obtenerResumenCalificaciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el resumen de calificaciones',
                error: error.message
            });
        }
    }
};

module.exports = calificacionesController;