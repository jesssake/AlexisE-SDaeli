// proxy.conf.js
module.exports = {
  "/api": {
    target: "http://localhost/gestion_e",
    secure: false,
    changeOrigin: true,
    logLevel: "debug",
    pathRewrite: { "^/api": "" }
  },

  // 🔹 NUEVO: para los PHP de configuracion
  "/configuracion": {
    target: "http://localhost/gestion_e",
    secure: false,
    changeOrigin: true,
    logLevel: "debug"
    // SIN pathRewrite → se mantiene /configuracion en la URL
    // /configuracion/perfil_alumno.php -> http://localhost/gestion_e/configuracion/perfil_alumno.php
  }
};
