// C:\Codigos\HTml\gestion-educativa\backend\controllers\estudiante\graduacion\graduacionModel.js
const db = require('../../../config/database');

class GraduacionEstudianteModel {
  
  // Verificar si el estudiante existe
  static async verificarEstudiante(estudiante_id) {
    try {
      const query = `
        SELECT 
          id,
          nino_nombre,
          tutor_email,
          tutor_nombre,
          nino_grado
        FROM usuarios 
        WHERE id = ?
          AND (rol IS NULL OR rol = '' OR rol = 'alumno' OR rol = 'tutor')
      `;
      
      const [rows] = await db.execute(query, [estudiante_id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error en verificarEstudiante:', error);
      throw error;
    }
  }
  
  // Obtener certificados del estudiante con filtros
  static async getCertificados(estudiante_id, filtros = {}) {
    try {
      let query = `
        SELECT 
          c.id,
          c.alumno_id,
          u.nino_nombre AS alumno_nombre,
          c.promedio,
          c.ciclo,
          c.maestro_firma,
          COALESCE(c.estado, 'pendiente') AS estado,
          DATE_FORMAT(c.creado_en, '%Y-%m-%d %H:%i:%s') AS fecha_creacion,
          DATE_FORMAT(c.creado_en, '%d/%m/%Y') AS fecha_formateada
        FROM certificados c
        LEFT JOIN usuarios u ON c.alumno_id = u.id
        WHERE c.alumno_id = ?
      `;
      
      const params = [estudiante_id];
      
      // Aplicar filtros
      if (filtros.estado && filtros.estado !== 'todos') {
        query += ` AND COALESCE(c.estado, 'pendiente') = ?`;
        params.push(filtros.estado);
      }
      
      if (filtros.ciclo && filtros.ciclo !== 'todos') {
        query += ` AND c.ciclo = ?`;
        params.push(filtros.ciclo);
      }
      
      if (filtros.tipo && filtros.tipo !== 'todos') {
        query += ` AND c.tipo = ?`;
        params.push(filtros.tipo);
      }
      
      query += ` ORDER BY c.creado_en DESC`;
      
      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Error en getCertificados:', error);
      throw error;
    }
  }
  
  // Obtener estadísticas del estudiante
  static async getEstadisticas(estudiante_id) {
    try {
      const query = `
        SELECT 
          COUNT(*) AS total,
          SUM(CASE WHEN COALESCE(estado, 'pendiente') = 'enviado' THEN 1 ELSE 0 END) AS enviados,
          SUM(CASE WHEN COALESCE(estado, 'pendiente') = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
          AVG(promedio) AS promedio_general,
          MIN(promedio) AS promedio_minimo,
          MAX(promedio) AS promedio_maximo,
          GROUP_CONCAT(DISTINCT ciclo SEPARATOR ', ') AS ciclos
        FROM certificados 
        WHERE alumno_id = ?
      `;
      
      const [rows] = await db.execute(query, [estudiante_id]);
      return rows[0] || {
        total: 0,
        enviados: 0,
        pendientes: 0,
        promedio_general: 0,
        promedio_minimo: 0,
        promedio_maximo: 0,
        ciclos: ''
      };
    } catch (error) {
      console.error('Error en getEstadisticas:', error);
      throw error;
    }
  }
  
  // Obtener ciclos únicos del estudiante
  static async getCiclosUnicos(estudiante_id) {
    try {
      const query = `
        SELECT DISTINCT ciclo 
        FROM certificados 
        WHERE alumno_id = ? 
          AND ciclo IS NOT NULL 
          AND ciclo != ''
        ORDER BY ciclo DESC
      `;
      
      const [rows] = await db.execute(query, [estudiante_id]);
      return rows.map(row => row.ciclo);
    } catch (error) {
      console.error('Error en getCiclosUnicos:', error);
      throw error;
    }
  }
  
  // Verificar permiso para descargar certificado
  static async puedeDescargar(certificado_id, estudiante_id) {
    try {
      const query = `
        SELECT 
          c.*,
          u.nino_nombre AS alumno_nombre,
          DATE_FORMAT(c.creado_en, '%d de %M de %Y') AS fecha_larga
        FROM certificados c
        LEFT JOIN usuarios u ON c.alumno_id = u.id
        WHERE c.id = ? 
          AND c.alumno_id = ?
          AND c.estado = 'enviado'
      `;
      
      const [rows] = await db.execute(query, [certificado_id, estudiante_id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error en puedeDescargar:', error);
      throw error;
    }
  }
  
  // Obtener información detallada del certificado
  static async getCertificadoDetalle(certificado_id, estudiante_id) {
    try {
      const query = `
        SELECT 
          c.*,
          u.nino_nombre AS alumno_nombre,
          u.tutor_nombre AS tutor_nombre,
          u.nino_grado AS grado,
          m.nino_nombre AS maestro_nombre,
          DATE_FORMAT(c.creado_en, '%d/%m/%Y %H:%i') AS fecha_completa
        FROM certificados c
        LEFT JOIN usuarios u ON c.alumno_id = u.id
        LEFT JOIN usuarios m ON c.maestro_id = m.id
        WHERE c.id = ? AND c.alumno_id = ?
      `;
      
      const [rows] = await db.execute(query, [certificado_id, estudiante_id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error en getCertificadoDetalle:', error);
      throw error;
    }
  }
  
  // Obtener resumen completo del estudiante
  static async getResumenCompleto(estudiante_id) {
    try {
      const query = `
        SELECT 
          e.id AS estudiante_id,
          e.nino_nombre AS estudiante_nombre,
          e.tutor_nombre,
          e.nino_grado,
          COUNT(c.id) AS total_certificados,
          SUM(CASE WHEN c.estado = 'enviado' THEN 1 ELSE 0 END) AS certificados_enviados,
          SUM(CASE WHEN c.estado = 'pendiente' THEN 1 ELSE 0 END) AS certificados_pendientes,
          AVG(c.promedio) AS promedio_general,
          GROUP_CONCAT(DISTINCT c.ciclo ORDER BY c.ciclo DESC SEPARATOR ', ') AS ciclos_disponibles,
          MAX(c.creado_en) AS ultimo_certificado,
          MIN(c.creado_en) AS primer_certificado
        FROM usuarios e
        LEFT JOIN certificados c ON e.id = c.alumno_id
        WHERE e.id = ?
        GROUP BY e.id
      `;
      
      const [rows] = await db.execute(query, [estudiante_id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error en getResumenCompleto:', error);
      throw error;
    }
  }
}

module.exports = GraduacionEstudianteModel;