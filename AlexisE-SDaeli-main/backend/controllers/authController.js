// C:\Codigos\HTml\gestion-educativa\backend\controllers\authController.js
// Controller de autenticación que reutiliza las funciones del loginController

const loginController = require('./login/loginController');

// 🔐 LOGIN PRINCIPAL (el mismo que usas en /api/login si quieres reutilizarlo)
exports.login = loginController.login;

// 🔐 LOGIN ALTERNATIVO (para la ruta /api/auth/login)
exports.loginAlternativo = loginController.loginAlternativo;
