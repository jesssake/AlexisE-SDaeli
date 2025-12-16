/**
 * ⚙️ CONFIGURACIÓN DE MIDDLEWARES
 */

module.exports = {
  // Rate limiting
  rateLimit: {
    enabled: process.env.NODE_ENV === 'production',
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: {
      general: 1000,
      auth: 5,
      creation: 50,
      public: 60
    }
  },
  
  // Validación
  validation: {
    enabled: true,
    strictMode: process.env.NODE_ENV === 'production'
  },
  
  // Desarrollo
  development: {
    skipAuth: process.env.DEV_SKIP_AUTH === 'true',
    skipRateLimit: process.env.DEV_SKIP_RATE_LIMIT === 'true',
    mockUser: {
      id: 1,
      nombre: 'Maestro Demo',
      rol: 'maestro'
    }
  }
};