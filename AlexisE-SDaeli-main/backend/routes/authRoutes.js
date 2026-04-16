// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/dbConfig');

// =====================================================
// 🔐 VALIDAR TOKEN - Versión que acepta tokens simples
// =====================================================
router.get('/validar-token', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  console.log('🔍 Validando token...');
  console.log('📋 Authorization header:', authHeader);
  
  // Verificar que el token existe
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Token no proporcionado');
    return res.status(401).json({ 
      ok: false, 
      success: false,
      message: 'Token no proporcionado' 
    });
  }
  
  const token = authHeader.substring(7);
  console.log('🔑 Token recibido:', token);
  
  // =====================================================
  // MODO DESARROLLO: Aceptar tokens simples
  // =====================================================
  
  // Tokens de desarrollo aceptados
  const tokensDesarrollo = [
    'token-desarrollo-12345',
    'MS0xNzc0NDg5NzM1MTk2',
    'MS0xNzc0Mzk4MDAzMTM0',
    'MS0xNzc0Mzk4MDAzMTM8'
  ];
  
  // Si es token de desarrollo o comienza con MS0xNzc (formato base64)
  if (tokensDesarrollo.includes(token) || token.startsWith('MS0xNzc')) {
    console.log('✅ Token de desarrollo válido');
    
    // Intentar extraer ID del token (formato: "ID-timestamp" en base64)
    let userId = 1;
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      console.log('📝 Token decodificado:', decoded);
      userId = parseInt(decoded.split('-')[0]) || 1;
    } catch (e) {
      console.log('⚠️ No se pudo decodificar token, usando ID por defecto');
    }
    
    console.log('👤 Buscando usuario con ID:', userId);
    
    // Buscar usuario en la base de datos
    try {
      const [usuarios] = await db.query(
        'SELECT id, rol FROM usuarios WHERE id = ?',
        [userId]
      );
      
      let rol = 'maestro';
      if (usuarios.length > 0) {
        rol = usuarios[0].rol;
        console.log('✅ Usuario encontrado, rol:', rol);
      } else {
        console.log('⚠️ Usuario no encontrado en BD, usando rol por defecto');
      }
      
      return res.json({ 
        ok: true, 
        success: true,
        message: 'Token válido',
        user: {
          id: userId,
          rol: rol
        }
      });
      
    } catch (dbError) {
      console.error('❌ Error consultando BD:', dbError);
      // Si hay error de BD, igual permitir acceso en desarrollo
      return res.json({ 
        ok: true, 
        success: true,
        message: 'Token válido (sin verificación BD)',
        user: {
          id: userId,
          rol: 'maestro'
        }
      });
    }
  }
  
  // =====================================================
  // MODO PRODUCCIÓN: Verificar JWT
  // =====================================================
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'secreto-desarrollo';
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token JWT decodificado:', { id: decoded.id, rol: decoded.rol });
    
    const [usuarios] = await db.query(
      'SELECT id, rol FROM usuarios WHERE id = ?',
      [decoded.id]
    );
    
    if (usuarios.length === 0) {
      console.log('❌ Usuario no encontrado');
      return res.status(401).json({ 
        ok: false, 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }
    
    res.json({ 
      ok: true, 
      success: true,
      message: 'Token válido',
      user: {
        id: decoded.id,
        rol: usuarios[0].rol
      }
    });
    
  } catch (error) {
    console.log('❌ Error verificando token JWT:', error.message);
    
    // En desarrollo, permitir acceso con cualquier token
    if (process.env.NODE_ENV !== 'production') {
      console.log('⚠️ MODO DESARROLLO: Token inválido pero permitiendo acceso');
      return res.json({ 
        ok: true, 
        success: true,
        message: 'Token válido (modo desarrollo)',
        user: {
          id: 1,
          rol: 'maestro'
        }
      });
    }
    
    return res.status(401).json({ 
      ok: false, 
      success: false,
      message: 'Token inválido' 
    });
  }
});

// Endpoint de prueba
router.get('/test', (req, res) => {
  res.json({ 
    ok: true, 
    success: true,
    message: 'Auth API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;