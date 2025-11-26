// C:\Codigos\HTml\gestion-educativa\backend\controllers\maestro\dashboard\dashboardController.js
const db = require('../../../config/dbConfig');

// =======================================================
// 🔹 OBTENER TODOS LOS AVISOS
// =======================================================
exports.getAvisos = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM avisos ORDER BY fecha_creacion DESC;");
        return res.json({ success: true, avisos: rows });
    } catch (error) {
        console.error("Error en getAvisos:", error);
        return res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
};

// =======================================================
// 🔹 OBTENER SOLO AVISOS ACTIVOS
// =======================================================
exports.getAvisosActivos = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM avisos WHERE activo = 1 ORDER BY fecha_creacion DESC;");
        return res.json({ success: true, avisos: rows });
    } catch (error) {
        console.error("Error en getAvisosActivos:", error);
        return res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
};

// =======================================================
// 🔹 CREAR AVISO
// =======================================================
exports.crearAviso = async (req, res) => {
    try {
        const { titulo, contenido, prioridad } = req.body;

        const sql = `
            INSERT INTO avisos (titulo, contenido, prioridad, activo)
            VALUES (?, ?, ?, 1)
        `;
        await db.query(sql, [titulo, contenido, prioridad]);

        return res.json({ success: true, message: "Aviso creado correctamente." });

    } catch (error) {
        console.error("Error en crearAviso:", error);
        return res.status(500).json({ success: false, message: "Error al crear aviso" });
    }
};

// =======================================================
// 🔹 ACTUALIZAR AVISO
// =======================================================
exports.actualizarAviso = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, contenido, prioridad, activo } = req.body;

        await db.query(
            `UPDATE avisos SET titulo=?, contenido=?, prioridad=?, activo=? WHERE id=?`,
            [titulo, contenido, prioridad, activo, id]
        );

        return res.json({ success: true, message: "Aviso actualizado." });

    } catch (error) {
        console.error("Error en actualizarAviso:", error);
        return res.status(500).json({ success: false, message: "Error al actualizar aviso" });
    }
};

// =======================================================
// 🔹 ELIMINAR AVISO
// =======================================================
exports.eliminarAviso = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query("DELETE FROM avisos WHERE id = ?", [id]);

        return res.json({ success: true, message: "Aviso eliminado." });

    } catch (error) {
        console.error("Error en eliminarAviso:", error);
        return res.status(500).json({ success: false, message: "Error al eliminar aviso" });
    }
};

// =======================================================
// 🔹 CAMBIAR ESTADO ACTIVO/INACTIVO
// =======================================================
exports.toggleAviso = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(`
            UPDATE avisos SET activo = NOT activo WHERE id = ?
        `, [id]);

        return res.json({ success: true, message: "Estado del aviso cambiado." });

    } catch (error) {
        console.error("Error en toggleAviso:", error);
        return res.status(500).json({ success: false, message: "Error al cambiar estado" });
    }
};
