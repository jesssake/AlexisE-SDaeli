// C:\Codigos\HTml\gestion-educativa\backend\controllers\login\loginController.js
const loginService = require('../../services/login/loginService');

// =============================================================
// 🔹 LOGIN PRINCIPAL
// =============================================================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  console.log('📥 Intento de login:', email);

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email y contraseña son requeridos'
    });
  }

  try {
    const user = await loginService.authenticateUser(email, password);
    
    if (user) {
      console.log('✅ Login exitoso para:', user.tutor_email);
      res.status(200).json({
        success: true,
        message: 'Login exitoso',
        user: {
          id: user.id,
          nombre: user.tutor_nombre,
          email: user.tutor_email,
          rol: user.rol
        },
        token: 'jwt-token-simulado'
      });
    } else {
      console.log('❌ Credenciales incorrectas');
      res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }
  } catch (error) {
    console.error('💥 Error en servidor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};


// =============================================================
// 🔹 LOGIN ALTERNATIVO (para /api/auth/login)
// =============================================================
exports.loginAlternativo = async (req, res) => {
  console.log("🔐 Login alternativo activado.");

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email y contraseña son requeridos'
    });
  }

  try {
    const user = await loginService.authenticateUser(email, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    res.json({
      success: true,
      message: "Login alternativo exitoso",
      data: user
    });

  } catch (err) {
    console.error("💥 Error en loginAlternativo:", err);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};
