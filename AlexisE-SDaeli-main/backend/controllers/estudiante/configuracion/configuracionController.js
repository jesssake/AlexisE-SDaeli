// backend/controllers/estudiante/configuracion/configuracionController.js

const pool = require('../../../config/dbConfig');
const bcrypt = require('bcrypt');

// ========================================
// TEST CONEXIÓN
// ========================================
const testConnection = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 as test, NOW() as timestamp, DATABASE() as database_name');
        res.json({
            success: true,
            message: '✅ Conexión a BD funcionando',
            data: rows[0]
        });
    } catch (error) {
        console.error('Error en testConnection:', error);
        res.status(500).json({
            success: false,
            message: 'Error de conexión a BD',
            error: error.message
        });
    }
};

// ========================================
// OBTENER NIÑOS DEL TUTOR
// ========================================
const getNinosByTutor = async (req, res) => {
    try {
        const { tutor_id } = req.params;
        
        console.log('📌 Buscando niños para tutor ID:', tutor_id);
        
        if (!tutor_id || isNaN(tutor_id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de tutor no válido'
            });
        }
        
        // Obtener el email del tutor
        const [tutorRows] = await pool.query(
            `SELECT tutor_email, tutor_nombre 
             FROM usuarios 
             WHERE id = ? AND LOWER(rol) = 'tutor'`,
            [tutor_id]
        );
        
        if (!tutorRows || tutorRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tutor no encontrado'
            });
        }
        
        const tutor = tutorRows[0];
        console.log('📧 Email del tutor:', tutor.tutor_email);
        
        // Obtener todos los niños con ese email
        const [ninosRows] = await pool.query(
            `SELECT 
                id,
                nino_nombre as nombre,
                fecha_nacimiento,
                nino_condiciones as condiciones_medicas,
                DATE_FORMAT(fecha_nacimiento, '%d/%m/%Y') as fecha_nacimiento_formateada
             FROM usuarios 
             WHERE tutor_email = ? 
             AND LOWER(rol) = 'tutor'
             AND nino_nombre IS NOT NULL 
             AND nino_nombre != ''
             ORDER BY fecha_nacimiento DESC, id ASC`,
            [tutor.tutor_email]
        );
        
        console.log(`👶 Encontrados ${ninosRows.length} niños`);
        
        res.json({
            success: true,
            ninos: ninosRows,
            total: ninosRows.length,
            message: ninosRows.length > 0 ? 'Alumnos cargados correctamente' : 'No hay alumnos asignados'
        });
        
    } catch (error) {
        console.error('❌ Error en getNinosByTutor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar los alumnos',
            error: error.message
        });
    }
};

// ========================================
// OBTENER INFO DEL TUTOR
// ========================================
const getTutorInfo = async (req, res) => {
    try {
        const { tutor_id } = req.params;
        
        const [rows] = await pool.query(
            `SELECT 
                id,
                tutor_nombre as nombre,
                tutor_email as email,
                tutor_telefono as telefono,
                rol,
                DATE_FORMAT(fecha_registro, '%d/%m/%Y %H:%i') as fecha_registro_formateada
             FROM usuarios 
             WHERE id = ? AND LOWER(rol) = 'tutor'`,
            [tutor_id]
        );
        
        if (!rows || rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tutor no encontrado'
            });
        }
        
        res.json({
            success: true,
            tutor: rows[0]
        });
        
    } catch (error) {
        console.error('❌ Error en getTutorInfo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener información del tutor',
            error: error.message
        });
    }
};

// ========================================
// OBTENER NIÑO POR ID
// ========================================
const getNinoById = async (req, res) => {
    try {
        const { nino_id } = req.params;
        
        const [rows] = await pool.query(
            `SELECT 
                id,
                nino_nombre as nombre,
                fecha_nacimiento,
                nino_condiciones as condiciones_medicas,
                DATE_FORMAT(fecha_nacimiento, '%d/%m/%Y') as fecha_nacimiento_formateada
             FROM usuarios 
             WHERE id = ? AND LOWER(rol) = 'tutor'
             AND nino_nombre IS NOT NULL`,
            [nino_id]
        );
        
        if (!rows || rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Niño no encontrado'
            });
        }
        
        res.json({
            success: true,
            nino: rows[0]
        });
        
    } catch (error) {
        console.error('❌ Error en getNinoById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener información del niño',
            error: error.message
        });
    }
};

// ========================================
// ACTUALIZAR PERFIL
// ========================================
const actualizarPerfil = async (req, res) => {
    try {
        const { tutor_id } = req.params;
        const { nombre, email, telefono } = req.body;
        
        console.log('📝 Actualizando perfil del tutor ID:', tutor_id);
        
        if (!tutor_id || isNaN(tutor_id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de tutor no válido'
            });
        }
        
        const [result] = await pool.query(
            `UPDATE usuarios 
             SET tutor_nombre = ?, 
                 tutor_email = ?, 
                 tutor_telefono = ?
             WHERE id = ? AND LOWER(rol) = 'tutor'`,
            [nombre, email, telefono, tutor_id]
        );
        
        res.json({
            success: true,
            message: 'Perfil actualizado correctamente',
            tutor: { id: tutor_id, nombre, email, telefono }
        });
        
    } catch (error) {
        console.error('❌ Error en actualizarPerfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el perfil',
            error: error.message
        });
    }
};

// ========================================
// CAMBIAR CONTRASEÑA
// ========================================
const cambiarPassword = async (req, res) => {
    try {
        const { tutor_id } = req.params;
        const { password_actual, password_nueva } = req.body;
        
        console.log('🔐 Cambiando contraseña para tutor ID:', tutor_id);
        
        if (!password_actual || !password_nueva) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña actual y nueva son requeridas'
            });
        }
        
        if (password_nueva.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }
        
        // Obtener contraseña actual
        const [rows] = await pool.query(
            `SELECT tutor_password FROM usuarios WHERE id = ? AND LOWER(rol) = 'tutor'`,
            [tutor_id]
        );
        
        if (!rows || rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tutor no encontrado'
            });
        }
        
        const passwordEnBD = rows[0].tutor_password;
        
        // Verificar contraseña actual (texto plano o encriptada)
        let passwordValida = false;
        if (passwordEnBD === password_actual) {
            passwordValida = true;
        } else {
            try {
                passwordValida = await bcrypt.compare(password_actual, passwordEnBD);
            } catch (err) {
                passwordValida = false;
            }
        }
        
        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }
        
        // Encriptar nueva contraseña
        const saltRounds = 10;
        const passwordEncriptada = await bcrypt.hash(password_nueva, saltRounds);
        
        // Actualizar
        await pool.query(
            `UPDATE usuarios SET tutor_password = ? WHERE id = ? AND LOWER(rol) = 'tutor'`,
            [passwordEncriptada, tutor_id]
        );
        
        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });
        
    } catch (error) {
        console.error('❌ Error en cambiarPassword:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar la contraseña',
            error: error.message
        });
    }
};

// ========================================
// ACTUALIZAR DATOS DEL ALUMNO
// ========================================
const actualizarNino = async (req, res) => {
    try {
        const { nino_id } = req.params;
        const { nombre, fecha_nacimiento, condiciones_medicas } = req.body;
        
        console.log('👶 Actualizando datos del niño ID:', nino_id);
        
        await pool.query(
            `UPDATE usuarios 
             SET nino_nombre = ?, 
                 fecha_nacimiento = ?, 
                 nino_condiciones = ?
             WHERE id = ? AND LOWER(rol) = 'tutor'`,
            [nombre, fecha_nacimiento, condiciones_medicas, nino_id]
        );
        
        res.json({
            success: true,
            message: 'Datos del alumno actualizados correctamente',
            nino: { id: nino_id, nombre, fecha_nacimiento, condiciones_medicas }
        });
        
    } catch (error) {
        console.error('❌ Error en actualizarNino:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar los datos del alumno',
            error: error.message
        });
    }
};

// ========================================
// EXPORTAR TODAS LAS FUNCIONES
// ========================================
module.exports = {
    testConnection,
    getNinosByTutor,
    getTutorInfo,
    getNinoById,
    actualizarPerfil,
    cambiarPassword,
    actualizarNino
};