// C:\Codigos\HTml\gestion-educativa\backend\scripts\insertarRelaciones.js
const path = require('path');
const db = require('../config/dbConfig'); // ← Importa la conexión a BD

console.log('🚀 SCRIPT: Insertar relaciones niño-materias');
console.log('📍 Ubicación:', __dirname);

async function insertarRelacionesNinoMaterias() {
  try {
    console.log('\n🔍 Verificando datos en la base de datos...\n');
    
    // 1. OBTENER TODOS LOS NIÑOS
    console.log('1. Buscando niños en la tabla usuarios...');
    const [ninos] = await db.query(`
      SELECT id, nino_nombre, tutor_nombre
      FROM usuarios 
      WHERE nino_nombre IS NOT NULL 
        AND nino_nombre != ''
        AND nino_nombre != 'NULL'
      ORDER BY id
    `);
    
    console.log(`   ✅ Encontrados: ${ninos.length} niños`);
    ninos.forEach((n, i) => {
      console.log(`      ${i+1}. ID ${n.id}: ${n.nino_nombre} (Tutor: ${n.tutor_nombre})`);
    });
    
    // 2. OBTENER TODAS LAS MATERIAS
    console.log('\n2. Buscando materias en la tabla materias...');
    const [materias] = await db.query(`
      SELECT id_materia, nombre, descripcion
      FROM materias 
      ORDER BY id_materia
    `);
    
    console.log(`   ✅ Encontradas: ${materias.length} materias`);
    materias.forEach((m, i) => {
      console.log(`      ${i+1}. ID ${m.id_materia}: ${m.nombre} (${m.descripcion || 'Sin descripción'})`);
    });
    
    if (ninos.length === 0) {
      console.error('❌ ERROR: No hay niños registrados en la base de datos');
      return;
    }
    
    if (materias.length === 0) {
      console.error('❌ ERROR: No hay materias registradas en la base de datos');
      return;
    }
    
    // 3. LIMPIAR TABLA EXISTENTE
    console.log('\n3. Limpiando tabla nino_materias...');
    try {
      await db.query('DELETE FROM nino_materias');
      console.log('   ✅ Tabla limpiada correctamente');
    } catch (error) {
      console.log('   ℹ️  Tabla ya estaba vacía o no existe');
    }
    
    // 4. INSERTAR TODAS LAS COMBINACIONES
    console.log('\n4. Insertando relaciones niño-materia...');
    console.log(`   📊 Total a insertar: ${ninos.length} niños × ${materias.length} materias = ${ninos.length * materias.length} relaciones`);
    
    let relacionesInsertadas = 0;
    let errores = 0;
    
    for (const nino of ninos) {
      for (const materia of materias) {
        try {
          await db.query(`
            INSERT INTO nino_materias (nino_id, id_materia, trimestre)
            VALUES (?, ?, '1')
          `, [nino.id, materia.id_materia]);
          
          relacionesInsertadas++;
          
          // Mostrar progreso cada 10 inserciones
          if (relacionesInsertadas % 10 === 0) {
            console.log(`   🔄 Progreso: ${relacionesInsertadas} relaciones insertadas...`);
          }
        } catch (error) {
          errores++;
          console.error(`   ❌ Error insertando ${nino.nino_nombre} -> ${materia.nombre}:`, error.message);
        }
      }
    }
    
    // 5. MOSTRAR RESULTADO
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN FINAL:');
    console.log('='.repeat(60));
    console.log(`   ✅ Relaciones insertadas exitosamente: ${relacionesInsertadas}`);
    console.log(`   ❌ Errores durante la inserción: ${errores}`);
    
    // 6. VERIFICAR EN BASE DE DATOS
    console.log('\n🔍 Verificando en base de datos...');
    
    // Total en tabla
    const [total] = await db.query('SELECT COUNT(*) as total FROM nino_materias');
    console.log(`   📈 Total registros en tabla nino_materias: ${total[0].total}`);
    
    // Verificación por niño
    const [verificacion] = await db.query(`
      SELECT 
        u.nino_nombre as Niño,
        COUNT(nm.id_materia) as Materias_Asignadas,
        GROUP_CONCAT(m.nombre ORDER BY m.nombre SEPARATOR ', ') as Lista_Materias
      FROM usuarios u
      LEFT JOIN nino_materias nm ON u.id = nm.nino_id
      LEFT JOIN materias m ON nm.id_materia = m.id_materia
      WHERE u.nino_nombre IS NOT NULL
        AND u.nino_nombre != ''
      GROUP BY u.id, u.nino_nombre
      ORDER BY u.nino_nombre
    `);
    
    console.log('\n👥 VERIFICACIÓN POR NIÑO:');
    console.log('─'.repeat(60));
    
    verificacion.forEach(v => {
      const estado = v.Materias_Asignadas === materias.length ? '✅ COMPLETO' : '⚠️ INCOMPLETO';
      console.log(`${estado}`);
      console.log(`   👶 ${v.Niño}`);
      console.log(`   📚 ${v.Materias_Asignadas}/${materias.length} materias asignadas`);
      if (v.Lista_Materias) {
        console.log(`   📖 Materias: ${v.Lista_Materias}`);
      }
      console.log('');
    });
    
    console.log('='.repeat(60));
    console.log('\n🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!');
    console.log('\n📋 Siguientes pasos:');
    console.log('   1. Ahora los niños pueden ver las tareas de sus materias');
    console.log('   2. El sistema filtrará correctamente las tareas por materia');
    console.log('   3. Puedes verificar en phpMyAdmin con la consulta SQL anterior');
    
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:', error);
    console.error('Stack:', error.stack);
  }
}

// 7. EJECUTAR SCRIPT PRINCIPAL
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       SCRIPT DE ASIGNACIÓN NIÑOS-MATERIAS               ║');
  console.log('║       PARA SISTEMA DE GESTIÓN EDUCATIVA                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  try {
    // Verificar conexión a BD
    console.log('\n🔌 Verificando conexión a base de datos...');
    await db.query('SELECT 1');
    console.log('✅ Conexión a BD establecida correctamente');
    
    // Verificar si existe tabla nino_materias
    console.log('\n📋 Verificando estructura de base de datos...');
    const [tablas] = await db.query("SHOW TABLES LIKE 'nino_materias'");
    
    if (tablas.length === 0) {
      console.error('❌ ERROR: La tabla "nino_materias" NO EXISTE');
      console.log('\n💡 SOLUCIÓN: Ejecuta este SQL en phpMyAdmin primero:');
      console.log(`
        CREATE TABLE nino_materias (
          id INT PRIMARY KEY AUTO_INCREMENT,
          nino_id INT NOT NULL,
          id_materia INT NOT NULL,
          trimestre ENUM('1','2','3') DEFAULT '1',
          fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (nino_id) REFERENCES usuarios(id),
          FOREIGN KEY (id_materia) REFERENCES materias(id_materia)
        )
      `);
      return;
    }
    
    console.log('✅ Tabla "nino_materias" encontrada');
    
    // Ejecutar el proceso principal
    await insertarRelacionesNinoMaterias();
    
  } catch (error) {
    console.error('\n❌ ERROR DE CONEXIÓN:', error.message);
    console.log('\n💡 SOLUCIÓN: Verifica que:');
    console.log('   1. El archivo config/dbConfig.js existe y está configurado');
    console.log('   2. MySQL está corriendo');
    console.log('   3. Las credenciales de BD son correctas');
  }
}

// Ejecutar todo
main().then(() => {
  console.log('\n✨ Script finalizado. Presiona Ctrl+C para salir.');
  // No cerrar automáticamente para que puedas ver los resultados
});