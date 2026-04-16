// server.js - Inicia el servidor usando la app configurada
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('\n==========================================');
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
    console.log('==========================================');
    
    console.log('\n✅ LOGIN FUNCIONAL:');
    console.log('   📍 POST http://localhost:3000/api/login');
    
    console.log('\n🔐 RECUPERACIÓN DE CONTRASEÑA:');
    console.log('   📍 Iniciar recuperación: POST http://localhost:3000/api/recuperar/iniciar');
    console.log('   📍 Verificar respuestas: POST http://localhost:3000/api/recuperar/verificar-respuestas');
    console.log('   📍 Verificar token: GET http://localhost:3000/api/recuperar/verificar-token/:token');
    console.log('   📍 Restablecer contraseña: POST http://localhost:3000/api/recuperar/restablecer/:token');
    console.log('\n   📌 PREGUNTAS DE SEGURIDAD PARA EL USUARIO (ID 3 - Alexis):');
    console.log('   • ¿Nombre de tu primera mascota? → pato');
    console.log('   • ¿Color favorito? → azul');
    console.log('   • ¿Ciudad favorita? → pizza');
    console.log('   • ¿Deporte favorito? → no');
    console.log('   • ¿Comida favorita? → pizzeria');
    
    console.log('\n⚙️ CONFIGURACIÓN MAESTRO:');
    console.log('   📍 GET http://localhost:3000/api/maestro/configuracion/test');
    
    console.log('\n🎓 MÓDULOS ESTUDIANTES:');
    console.log('   📍 Calificaciones: GET /api/estudiante/calificaciones/test');
    console.log('   📍 Tareas: GET /api/estudiante/tareas/test');
    console.log('   📍 Reportes: GET /api/reportes-alumno/test');
    console.log('   📍 Chat: GET /api/estudiante/padres/test');
    console.log('   📍 Graduación: GET /api/estudiante/graduacion/test');
    
    console.log('\n👨‍👩‍👧 CONFIGURACIÓN TUTORES/ESTUDIANTES (REAL):');
    console.log('   📍 Test: GET http://localhost:3000/api/configuracion/test');
    console.log('   📍 Lista de niños del tutor: GET http://localhost:3000/api/configuracion/tutor/:tutor_id/ninos');
    console.log('   📍 Información del tutor: GET http://localhost:3000/api/configuracion/tutor/:tutor_id/info');
    console.log('   📍 Información de niño específico: GET http://localhost:3000/api/configuracion/nino/:nino_id');
    console.log('   📍 Editar perfil: POST http://localhost:3000/api/configuracion/tutor/:tutor_id/perfil');
    console.log('   📍 Cambiar contraseña: POST http://localhost:3000/api/configuracion/tutor/:tutor_id/password');
    console.log('   📍 Editar alumno: POST http://localhost:3000/api/configuracion/nino/:nino_id');
    console.log('\n   📌 EJEMPLOS PRÁCTICOS:');
    console.log('   • Tutor ID 3 (Alexis): http://localhost:3000/api/configuracion/tutor/3/ninos');
    console.log('   • Información tutor: http://localhost:3000/api/configuracion/tutor/3/info');
    console.log('   • Información niño ID 3: http://localhost:3000/api/configuracion/nino/3');
    
    console.log('\n🔐 CREDENCIALES:');
    console.log('   📧 admin@escuela.com / Admin123');
    console.log('   📧 juan.perez@escuela.edu / 2025Eliana_Obil (MAESTRO)');
    console.log('   📧 tutor@example.com / Tutor123');
    console.log('   📧 biospacensap2025@gmail.com / 2025ELIANAdavid-j (TUTOR)');
    console.log('\n   📌 TUTORES EXISTENTES EN BD:');
    console.log('   • ID 3: Alexis David Obil Colli (biospacensap2025@gmail.com)');
    console.log('   • ID 2: Ana Garcia (ana@ejemplo.com)');
    console.log('   • ID 8: Juan Pérez (juan.perez1@example.com)');
    
    console.log('\n📋 Pruebas:');
    console.log('   • GET http://localhost:3000/api/test');
    console.log('   • GET http://localhost:3000/api/health');
    console.log('   • POST http://localhost:3000/api/login (con JSON)');
    console.log('   • GET http://localhost:3000/api/debug-routes (ver todas las rutas)');
    console.log('   • POST http://localhost:3000/api/recuperar/iniciar (recuperar contraseña)');
    
    console.log('\n==========================================');
    console.log('🎯 Endpoint principal para el frontend:');
    console.log('   • Configuración: http://localhost:3000/api/configuracion');
    console.log('   • Recuperación: http://localhost:3000/api/recuperar');
    console.log('==========================================\n');
});