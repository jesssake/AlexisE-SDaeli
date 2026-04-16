export const environment = {
  production: true,

  // En producción usa el proxy de Nginx
  apiUrl: '/api',

  // 🔥 API BASE para producción
  apiBase: '/api',
  
  // 📝 Control de logs
  logging: false  // ← AGREGAR ESTA LÍNEA (logs OCULTOS en producción)
};