// C:\Codigos\HTml\gestion-educativa\backend\controllers\maestro\graduacion\graduacionModel.js

const db = require('../../../config/database');

class GraduacionModel {
    
    // Obtener alumnos del maestro
    static async getAlumnosByMaestro(maestro_id) {
        try {
            const query = `
                SELECT 
                    id,
                    nino_nombre AS nombre
                FROM usuarios 
                WHERE rol = 'alumno' OR rol IS NULL OR rol = ''
                ORDER BY nino_nombre
            `;
            
            const [rows] = await db.execute(query);
            return rows;
        } catch (error) {
            console.error('Error en getAlumnosByMaestro:', error);
            throw error;
        }
    }
    
    // Obtener configuración del maestro
    static async getConfiguracion(maestro_id) {
        try {
            const query = `
                SELECT 
                    ciclo_actual,
                    nombre_maestro_firma
                FROM configuracion 
                WHERE maestro_id = ?
            `;
            
            const [rows] = await db.execute(query, [maestro_id]);
            
            if (rows.length === 0) {
                // Crear configuración por defecto
                const insertQuery = `
                    INSERT INTO configuracion (maestro_id, ciclo_actual, nombre_maestro_firma) 
                    VALUES (?, '2025-2026', 'Juan Pérez')
                `;
                
                await db.execute(insertQuery, [maestro_id]);
                
                return {
                    ciclo_actual: '2025-2026',
                    nombre_maestro_firma: 'Juan Pérez'
                };
            }
            
            return rows[0];
        } catch (error) {
            console.error('Error en getConfiguracion:', error);
            throw error;
        }
    }
    
    // Crear certificado
    static async crearCertificado({ alumno_id, maestro_id, promedio, ciclo, maestro_firma }) {
        try {
            const query = `
                INSERT INTO certificados 
                (alumno_id, maestro_id, promedio, ciclo, maestro_firma) 
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const [result] = await db.execute(query, [
                alumno_id,
                maestro_id,
                promedio,
                ciclo,
                maestro_firma
            ]);
            
            return result.insertId;
        } catch (error) {
            console.error('Error en crearCertificado:', error);
            throw error;
        }
    }
    
    // Actualizar configuración
    static async actualizarConfiguracion({ maestro_id, ciclo_actual, nombre_maestro_firma, ultimo_alumno_id }) {
        try {
            const query = `
                UPDATE configuracion 
                SET ciclo_actual = ?,
                    nombre_maestro_firma = ?,
                    ultimo_alumno_id = ?,
                    actualizado_en = NOW()
                WHERE maestro_id = ?
            `;
            
            const [result] = await db.execute(query, [
                ciclo_actual,
                nombre_maestro_firma,
                ultimo_alumno_id,
                maestro_id
            ]);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en actualizarConfiguracion:', error);
            throw error;
        }
    }
    
    // Listar certificados con filtros
    static async listarCertificados({ maestro_id, tipo = 'todos', estado = 'todos', alumnoId = 0 }) {
        try {
            let query = `
                SELECT 
                    c.id,
                    c.alumno_id,
                    u.nino_nombre AS alumno_nombre,
                    c.promedio,
                    c.ciclo,
                    c.maestro_firma,
                    DATE_FORMAT(c.creado_en, '%Y-%m-%d %H:%i') AS fecha_creacion
                FROM certificados c
                LEFT JOIN usuarios u ON c.alumno_id = u.id
                WHERE c.maestro_id = ?
            `;
            
            const params = [maestro_id];
            
            if (tipo !== 'todos') {
                query += ` AND c.tipo = ?`;
                params.push(tipo);
            }
            
            // Nota: Necesitarías agregar columna 'estado' a la tabla certificados
            if (estado !== 'todos') {
                query += ` AND c.estado = ?`;
                params.push(estado);
            }
            
            if (alumnoId > 0) {
                query += ` AND c.alumno_id = ?`;
                params.push(alumnoId);
            }
            
            query += ` ORDER BY c.creado_en DESC`;
            
            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error en listarCertificados:', error);
            throw error;
        }
    }
    
    // Obtener estadísticas
    static async getEstadisticas(maestro_id) {
        try {
            const query = `
                SELECT 
                    COUNT(*) AS total,
                    SUM(CASE WHEN tipo = 'excelencia' THEN 1 ELSE 0 END) AS excelencia,
                    SUM(CASE WHEN tipo = 'cierre' THEN 1 ELSE 0 END) AS cierre,
                    SUM(CASE WHEN estado = 'enviado' THEN 1 ELSE 0 END) AS enviados
                FROM certificados 
                WHERE maestro_id = ?
            `;
            
            const [rows] = await db.execute(query, [maestro_id]);
            
            return rows[0] || {
                total: 0,
                excelencia: 0,
                cierre: 0,
                enviados: 0
            };
        } catch (error) {
            console.error('Error en getEstadisticas:', error);
            throw error;
        }
    }
    
    // Cambiar estado de certificado
    static async cambiarEstado(certificado_id, estado) {
        try {
            const query = `
                UPDATE certificados 
                SET estado = ? 
                WHERE id = ?
            `;
            
            const [result] = await db.execute(query, [estado, certificado_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en cambiarEstado:', error);
            throw error;
        }
    }
    
    // Eliminar certificado
    static async eliminarCertificado(certificado_id) {
        try {
            const query = `DELETE FROM certificados WHERE id = ?`;
            const [result] = await db.execute(query, [certificado_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en eliminarCertificado:', error);
            throw error;
        }
    }
    
    // Guardar URL del logo
    static async guardarLogoUrl(maestro_id, logo_url) {
        try {
            // Necesitarías agregar columna logo_url a la tabla configuracion
            const query = `
                UPDATE configuracion 
                SET logo_url = ?,
                    actualizado_en = NOW()
                WHERE maestro_id = ?
            `;
            
            const [result] = await db.execute(query, [logo_url, maestro_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en guardarLogoUrl:', error);
            throw error;
        }
    }
    
    // Obtener certificado por ID
    static async getCertificadoById(certificado_id) {
        try {
            const query = `
                SELECT 
                    c.*,
                    u.nino_nombre AS alumno_nombre
                FROM certificados c
                LEFT JOIN usuarios u ON c.alumno_id = u.id
                WHERE c.id = ?
            `;
            
            const [rows] = await db.execute(query, [certificado_id]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error en getCertificadoById:', error);
            throw error;
        }
    }
}

module.exports = GraduacionModel;