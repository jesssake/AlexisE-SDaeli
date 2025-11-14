// proxy.conf.js
module.exports = {
  "/api": {
    target: "http://localhost/gestion_e",  // URL de tu servidor backend
    secure: false,  // Deshabilita SSL (usado si no tienes HTTPS)
    changeOrigin: true,  // Cambia el origen de la solicitud
    logLevel: "debug",  // Registro detallado para depuración
    pathRewrite: { "^/api": "" }  // Reescribe la URL eliminando el prefijo "/api"
  },

  // Configuración adicional para las rutas de configuración PHP
  "/configuracion": {
    target: "http://localhost/gestion_e",  // URL de tu servidor backend
    secure: false,
    changeOrigin: true,
    logLevel: "debug"
    // No pathRewrite: se mantiene "/configuracion" en la URL.
    // Ejemplo: /configuracion/perfil_alumno.php -> http://localhost/gestion_e/configuracion/perfil_alumno.php
  }
};
