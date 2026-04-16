// C:\Codigos\HTml\AlexisE-SDaeli-main\AlexisE-SDaeli-main\backend\controllers\estudiante\calificaciones\calificacionesController.js

const db = require('../../../config/dbConfig');

const calificacionesController = {
    // Obtener calificaciones por ID de estudiante
    obtenerCalificacionesPorEstudiante: async (req, res) => {
        try {
            const { id } = req.params;
            
            console.log('📊 Obteniendo calificaciones para estudiante ID:', id);
            
            // Verificar que el estudiante existe
            const [estudiante] = await db.query(
                'SELECT id, nino_nombre FROM usuarios WHERE id = ?',
                [id]
            );
            
            if (!estudiante.length) {
                return res.status(404).json({
                    ok: false,
                    error: 'Estudiante no encontrado'
                });
            }
            
            // Obtener calificaciones
            const [calificaciones] = await db.query(`
                SELECT 
                    t.id_tarea,
                    t.titulo,
                    t.instrucciones,
                    DATE_FORMAT(t.fecha_cierre, '%Y-%m-%d') as fecha_cierre,
                    t.trimestre,
                    t.created_by as maestro_id,
                    e.calificacion,
                    t.id_materia,
                    m.nombre as materia_nombre,
                    m.color as materia_color,
                    m.icono as materia_icono,
                    DATE_FORMAT(e.fecha_entrega, '%Y-%m-%d') as fecha_entrega,
                    CASE 
                        WHEN e.calificacion >= 9 THEN 'EXCELENTE'
                        WHEN e.calificacion >= 7 THEN 'BUENO'
                        WHEN e.calificacion >= 6 THEN 'SUFICIENTE'
                        ELSE 'INSUFICIENTE'
                    END as nivel_desempeno
                FROM tareas t
                INNER JOIN entregas_tareas e ON t.id_tarea = e.id_tarea 
                LEFT JOIN materias m ON t.id_materia = m.id_materia
                WHERE e.estudiante_id = ? 
                AND e.calificacion IS NOT NULL
                ORDER BY t.trimestre, t.fecha_cierre DESC
            `, [id]);
            
            console.log(`📊 Calificaciones encontradas: ${calificaciones.length}`);
            
            // Agrupar por trimestre
            const trimestres = [];
            const trimestresMap = {};
            
            calificaciones.forEach(tarea => {
                const trimestreId = tarea.trimestre;
                const calificacion = tarea.calificacion ? parseFloat(tarea.calificacion) : null;
                
                if (!trimestresMap[trimestreId]) {
                    trimestresMap[trimestreId] = {
                        id: trimestreId,
                        nombre: `${trimestreId}° Trimestre`,
                        promedio: null,
                        tareas: []
                    };
                    trimestres.push(trimestresMap[trimestreId]);
                }
                
                trimestresMap[trimestreId].tareas.push({
                    tarea_id: tarea.id_tarea,
                    titulo: tarea.titulo,
                    instrucciones: tarea.instrucciones || '',
                    fecha_cierre: tarea.fecha_cierre,
                    maestro_id: tarea.maestro_id,
                    calificacion: calificacion,
                    materia_nombre: tarea.materia_nombre || 'Sin materia',
                    materia_color: tarea.materia_color || '#667eea',
                    materia_icono: tarea.materia_icono || '📘',
                    fecha_entrega: tarea.fecha_entrega,
                    nivel_desempeno: tarea.nivel_desempeno
                });
            });
            
            // ✅ Calcular promedios por trimestre (promedio de tareas dentro del trimestre)
            trimestres.forEach(trimestre => {
                const calificacionesTrimestre = trimestre.tareas
                    .map(t => t.calificacion)
                    .filter(c => c !== null);
                
                if (calificacionesTrimestre.length > 0) {
                    const suma = calificacionesTrimestre.reduce((a, b) => a + b, 0);
                    trimestre.promedio = Math.round((suma / calificacionesTrimestre.length) * 100) / 100;
                    console.log(`📊 Promedio ${trimestre.nombre}: ${trimestre.promedio} (${calificacionesTrimestre.length} tareas)`);
                }
            });
            
            // ✅ CALCULAR PROMEDIO GLOBAL = PROMEDIO DE LOS TRIMESTRES
            let promedioGlobal = null;
            const trimestresConPromedio = trimestres.filter(t => t.promedio !== null);
            
            if (trimestresConPromedio.length > 0) {
                const sumaPromedios = trimestresConPromedio.reduce((a, b) => a + b.promedio, 0);
                promedioGlobal = Math.round((sumaPromedios / trimestresConPromedio.length) * 100) / 100;
                console.log(`📊 Promedio global (promedio de ${trimestresConPromedio.length} trimestres): ${promedioGlobal}`);
            } else {
                console.log('⚠️ No hay trimestres con promedios para calcular promedio global');
            }
            
            console.log(`✅ ${calificaciones.length} calificaciones encontradas para estudiante ${id}`);
            console.log(`✅ ${trimestres.length} trimestres procesados`);
            console.log(`✅ Promedio global: ${promedioGlobal}`);
            
            res.json({
                ok: true,
                alumno_id: parseInt(id),
                alumno_nombre: estudiante[0].nino_nombre,
                promedio_global: promedioGlobal,
                trimestres: trimestres
            });
            
        } catch (error) {
            console.error('❌ Error en obtenerCalificacionesPorEstudiante:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al obtener las calificaciones del estudiante',
                message: error.message
            });
        }
    },

    // Obtener resumen de calificaciones
    obtenerResumenCalificaciones: async (req, res) => {
        try {
            const { id } = req.params;
            
            const [resumen] = await db.query(`
                SELECT 
                    COUNT(DISTINCT t.id_tarea) as total_tareas,
                    COUNT(DISTINCT CASE WHEN e.calificacion >= 6 THEN t.id_tarea END) as tareas_aprobadas,
                    COUNT(DISTINCT CASE WHEN e.calificacion < 6 THEN t.id_tarea END) as tareas_reprobadas,
                    ROUND(AVG(e.calificacion), 2) as promedio_general,
                    ROUND(MAX(e.calificacion), 2) as calificacion_maxima,
                    ROUND(MIN(e.calificacion), 2) as calificacion_minima
                FROM tareas t
                INNER JOIN entregas_tareas e ON t.id_tarea = e.id_tarea
                WHERE e.estudiante_id = ? 
                AND e.calificacion IS NOT NULL
            `, [id]);
            
            const [mejoresMaterias] = await db.query(`
                SELECT 
                    m.nombre as materia,
                    ROUND(AVG(e.calificacion), 2) as promedio,
                    COUNT(e.id_entrega) as total_tareas
                FROM entregas_tareas e
                INNER JOIN tareas t ON e.id_tarea = t.id_tarea
                INNER JOIN materias m ON t.id_materia = m.id_materia
                WHERE e.estudiante_id = ? 
                AND e.calificacion IS NOT NULL
                GROUP BY m.id_materia, m.nombre
                ORDER BY promedio DESC
                LIMIT 3
            `, [id]);
            
            res.json({
                ok: true,
                resumen: resumen[0] || {},
                mejores_materias: mejoresMaterias
            });
            
        } catch (error) {
            console.error('❌ Error en obtenerResumenCalificaciones:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al obtener resumen de calificaciones'
            });
        }
    },

    // Obtener calificaciones por materia
    obtenerCalificacionesPorMateria: async (req, res) => {
        try {
            const { estudiante_id, materia_id } = req.params;
            
            const [calificaciones] = await db.query(`
                SELECT 
                    t.id_tarea,
                    t.titulo,
                    t.instrucciones,
                    DATE_FORMAT(t.fecha_cierre, '%Y-%m-%d') as fecha_cierre,
                    t.trimestre,
                    e.calificacion,
                    DATE_FORMAT(e.fecha_entrega, '%Y-%m-%d') as fecha_entrega,
                    CASE 
                        WHEN e.calificacion >= 9 THEN 'EXCELENTE'
                        WHEN e.calificacion >= 7 THEN 'BUENO'
                        WHEN e.calificacion >= 6 THEN 'SUFICIENTE'
                        ELSE 'INSUFICIENTE'
                    END as nivel_desempeno
                FROM tareas t
                INNER JOIN entregas_tareas e ON t.id_tarea = e.id_tarea
                WHERE e.estudiante_id = ? 
                AND t.id_materia = ?
                AND e.calificacion IS NOT NULL
                ORDER BY t.trimestre, t.fecha_cierre DESC
            `, [estudiante_id, materia_id]);
            
            res.json({
                ok: true,
                materia_id: parseInt(materia_id),
                calificaciones: calificaciones
            });
            
        } catch (error) {
            console.error('❌ Error en obtenerCalificacionesPorMateria:', error);
            res.status(500).json({
                ok: false,
                error: 'Error al obtener calificaciones por materia'
            });
        }
    },

    // Endpoint de prueba
    test: async (req, res) => {
        res.json({
            ok: true,
            message: '✅ Sistema de calificaciones para estudiantes funcionando correctamente',
            endpoints: [
                'GET /api/estudiante/calificaciones/:id',
                'GET /api/estudiante/calificaciones/:id/resumen',
                'GET /api/estudiante/calificaciones/:estudiante_id/materia/:materia_id',
                'GET /api/estudiante/calificaciones/test'
            ]
        });
    }
};

module.exports = calificacionesController;