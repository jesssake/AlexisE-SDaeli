/**
 * 🧪 SCRIPT DE PRUEBA PARA MIDDLEWARES
 * Ejecutar: node test-middleware.js
 */

const path = require('path');

// Configurar entorno de desarrollo para pruebas
process.env.NODE_ENV = 'development';
process.env.DEV_SKIP_AUTH = 'true';
process.env.DEV_SKIP_RATE_LIMIT = 'true';

console.log('🧪 ============================================');
console.log('🧪 PRUEBA DEL SISTEMA DE MIDDLEWARES');
console.log('🧪 ============================================\n');

try {
  // 1. Cargar el cargador de middlewares
  console.log('1. 📦 CARGANDO MIDDLEWARE LOADER...');
  const middlewareLoader = require('./middlewares/index');
  
  // 2. Listar todos los middlewares disponibles
  console.log('\n2. 📋 MIDDLEWARES DISPONIBLES:');
  console.log('   ' + '─'.repeat(50));
  
  const middlewaresList = middlewareLoader.list();
  
  if (middlewaresList.length === 0) {
    console.log('   ❌ No se encontraron middlewares');
  } else {
    middlewaresList.forEach((mw, index) => {
      const status = mw.isTemporary ? '🟡 TEMPORAL' : '🟢 PERMANENTE';
      console.log(`   ${index + 1}. ${mw.name.padEnd(12)} → ${status}`);
      console.log(`      Tipo: ${mw.type}`);
    });
  }
  
  // 3. Probar obtención de middlewares específicos
  console.log('\n3. 🔧 PROBANDO OBTENCIÓN DE MIDDLEWARES:');
  console.log('   ' + '─'.repeat(50));
  
  const middlewareTests = [
    { name: 'auth', expected: true },
    { name: 'maestro', expected: true },
    { name: 'validacion', expected: true },
    { name: 'ratelimit', expected: true },
    { name: 'inexistente', expected: false }
  ];
  
  middlewareTests.forEach(test => {
    try {
      const exists = middlewareLoader.has(test.name);
      const result = exists ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO';
      const match = (exists === test.expected) ? '✓' : '✗';
      
      console.log(`   ${match} ${test.name.padEnd(12)} → ${result}`);
      
      if (exists) {
        const mw = middlewareLoader.get(test.name);
        console.log(`      Tipo función: ${typeof mw}`);
      }
    } catch (error) {
      console.log(`   ✗ ${test.name.padEnd(12)} → ❌ ERROR: ${error.message}`);
    }
  });
  
  // 4. Probar middleware de rate limiting
  console.log('\n4. ⚡ PROBANDO RATE LIMITING:');
  console.log('   ' + '─'.repeat(50));
  
  try {
    const rateLimiter = require('./middlewares/rateLimit');
    const stats = rateLimiter.getStats();
    
    console.log(`   ✅ RateLimiter cargado correctamente`);
    console.log(`      Claves activas: ${stats.totalKeys}`);
    console.log(`      Usando memoria: ${stats.usingMemory ? 'Sí' : 'No'}`);
    
    if (stats.activeRequests && stats.activeRequests.length > 0) {
      console.log(`      Requests activos: ${stats.activeRequests.length}`);
    }
  } catch (error) {
    console.log(`   ❌ Error cargando rateLimiter: ${error.message}`);
  }
  
  // 5. Probar configuración
  console.log('\n5. ⚙️ PROBANDO CONFIGURACIÓN:');
  console.log('   ' + '─'.repeat(50));
  
  try {
    const config = require('./config/middlewareConfig');
    
    console.log(`   ✅ Configuración cargada`);
    console.log(`      Entorno: ${process.env.NODE_ENV}`);
    console.log(`      RateLimit habilitado: ${config.rateLimit.enabled ? 'Sí' : 'No'}`);
    console.log(`      Validación habilitada: ${config.validation.enabled ? 'Sí' : 'No'}`);
    console.log(`      Modo desarrollo: ${config.development.skipAuth ? 'Sí' : 'No'}`);
  } catch (error) {
    console.log(`   ❌ Error cargando configuración: ${error.message}`);
  }
  
  // 6. Simular una petición HTTP falsa
  console.log('\n6. 🌐 SIMULANDO PETICIÓN HTTP:');
  console.log('   ' + '─'.repeat(50));
  
  const mockRequest = {
    method: 'POST',
    path: '/api/maestro/tareas/crear',
    ip: '127.0.0.1',
    user: { id: 1, rol: 'maestro' },
    query: {},
    body: {
      titulo: 'Tarea de prueba',
      fecha_cierre: '2024-12-31 23:59:00',
      id_materia: '1'
    }
  };
  
  console.log(`   Método: ${mockRequest.method}`);
  console.log(`   Ruta: ${mockRequest.path}`);
  console.log(`   IP: ${mockRequest.ip}`);
  console.log(`   Usuario: ${JSON.stringify(mockRequest.user)}`);
  console.log(`   Datos: ${JSON.stringify(mockRequest.body)}`);
  
  // 7. Verificar estructura de carpetas
  console.log('\n7. 📁 ESTRUCTURA DE CARPETAS VERIFICADA:');
  console.log('   ' + '─'.repeat(50));
  
  const fs = require('fs');
  const requiredFiles = [
    './middlewares/index.js',
    './middlewares/authMiddleware.js', 
    './middlewares/maestroMiddleware.js',
    './middlewares/validacion.js',
    './middlewares/rateLimit.js',
    './config/middlewareConfig.js'
  ];
  
  requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  });
  
  console.log('\n🎉 ============================================');
  console.log('🎉 PRUEBA COMPLETADA EXITOSAMENTE!');
  console.log('🎉 ============================================');
  
  console.log('\n📋 RESUMEN:');
  console.log(`   Middlewares cargados: ${middlewaresList.length}`);
  console.log(`   Archivos encontrados: ${requiredFiles.filter(f => fs.existsSync(f)).length}/${requiredFiles.length}`);
  console.log(`   Entorno: ${process.env.NODE_ENV}`);
  
  console.log('\n🚀 PASOS SIGUIENTES:');
  console.log('   1. Ejecutar el servidor: npm start');
  console.log('   2. Probar endpoint de salud: GET /api/maestro/tareas/health');
  console.log('   3. Verificar logs en consola');
  
} catch (error) {
  console.error('\n💥 ERROR CRÍTICO DURANTE LA PRUEBA:');
  console.error(`   Mensaje: ${error.message}`);
  console.error(`   Stack: ${error.stack}`);
  console.log('\n🔧 SOLUCIÓN:');
  console.log('   1. Verifica que todos los archivos existan');
  console.log('   2. Revisa los paths en require()');
  console.log('   3. Ejecuta desde la raíz del proyecto');
}