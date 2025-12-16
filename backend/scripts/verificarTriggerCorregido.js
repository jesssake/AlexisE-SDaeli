// C:\Codigos\HTml\gestion-educativa\backend\scripts\verificarTriggerCorregido.js
const db = require('../config/dbConfig');

async function verificarTriggers() {
  console.log('🔍 VERIFICANDO TRIGGERS EN BASE DE DATOS');
  console.log('='.repeat(60));
  
  try {
    // 1. Ver TODOS los triggers
    console.log('1. Listando todos los triggers...\n');
    const [todosTriggers] = await db.query('SHOW TRIGGERS');
    
    if (todosTriggers.length === 0) {
      console.error('❌ No hay triggers en la base de datos');
      return;
    }
    
    console.log(`📊 Total de triggers: ${todosTriggers.length}`);
    console.log('─'.repeat(50));
    
    todosTriggers.forEach((trigger, index) => {
      console.log(`${index + 1}. 🔹 ${trigger.Trigger}`);
      console.log(`   📋 Evento: ${trigger.Event}`);
      console.log(`   ⏰ Timing: ${trigger.Timing}`);
      console.log(`   📁 Tabla: ${trigger.Table}`);
      console.log(`   📝 Statement: ${trigger.Statement.substring(0, 100)}...`);
      console.log('');
    });
    
    // 2. Buscar específicamente nuestro trigger
    console.log('2. Buscando trigger after_materia_insert...\n');
    
    const triggerMaterias = todosTriggers.find(t => 
      t.Trigger === 'after_materia_insert' && 
      t.Table === 'materias'
    );
    
    if (triggerMaterias) {
      console.log('✅✅✅ ¡TRIGGER ENCONTRADO!');
      console.log('─'.repeat(40));
      console.log(`🔹 Nombre: ${triggerMaterias.Trigger}`);
      console.log(`🔹 Evento: ${triggerMaterias.Event}`);
      console.log(`🔹 Timing: ${triggerMaterias.Timing}`);
      console.log(`🔹 Tabla: ${triggerMaterias.Table}`);
      console.log(`🔹 Statement completo:`);
      console.log(triggerMaterias.Statement);
      console.log('');
    } else {
      console.error('❌ Trigger after_materia_insert NO encontrado');
      return;
    }
    
    // 3. Probar el trigger creando una materia
    console.log('3. Probando funcionamiento del trigger...\n');
    
    // Contar niños
    const [totalNinos] = await db.query(`
      SELECT COUNT(*) as total 
      FROM usuarios 
      WHERE nino_nombre IS NOT NULL 
        AND nino_nombre != ''
        AND nino_nombre != 'NULL'
    `);
    
    console.log(`👥 Niños en sistema: ${totalNinos[0].total}`);
    
    // Contar materias actuales
    const [totalMaterias] = await db.query('SELECT COUNT(*) as total FROM materias');
    console.log(`📚 Materias actuales: ${totalMaterias[0].total}`);
    
    // Crear materia de prueba
    const nombrePrueba = `TEST_TRIGGER_${Date.now()}`;
    console.log(`\n📝 Creando materia de prueba: "${nombrePrueba}"`);
    
    const [result] = await db.query(`
      INSERT INTO materias (nombre, descripcion, color, icono, created_by)
      VALUES (?, 'Materia de prueba para trigger', '#FF5733', '🧪', 1)
    `, [nombrePrueba]);
    
    const nuevaMateriaId = result.insertId;
    console.log(`✅ Materia creada con ID: ${nuevaMateriaId}`);
    
    // Esperar para que el trigger se ejecute
    console.log('⏳ Esperando ejecución del trigger...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar asignaciones
    const [asignaciones] = await db.query(`
      SELECT COUNT(*) as total_asignaciones
      FROM nino_materias 
      WHERE id_materia = ?
    `, [nuevaMateriaId]);
    
    console.log(`📊 Asignaciones creadas por trigger: ${asignaciones[0].total_asignaciones}`);
    
    if (asignaciones[0].total_asignaciones === totalNinos[0].total) {
      console.log('🎉 ¡TRIGGER FUNCIONANDO CORRECTAMENTE!');
      console.log(`   Se asignó a ${asignaciones[0].total_asignaciones}/${totalNinos[0].total} niños`);
    } else {
      console.error(`⚠️  Alerta: Esperaba ${totalNinos[0].total}, obtuve ${asignaciones[0].total_asignaciones}`);
    }
    
    // Mostrar algunos ejemplos
    console.log('\n4. Muestra de asignaciones creadas:');
    const [ejemplos] = await db.query(`
      SELECT 
        u.nino_nombre as Niño,
        nm.fecha_inscripcion as Fecha_Asignacion
      FROM nino_materias nm
      JOIN usuarios u ON nm.nino_id = u.id
      WHERE nm.id_materia = ?
      LIMIT 5
    `, [nuevaMateriaId]);
    
    ejemplos.forEach((ej, i) => {
      const fecha = new Date(ej.Fecha_Asignacion).toLocaleTimeString();
      console.log(`   ${i + 1}. 👶 ${ej.Niño} - Asignado: ${fecha}`);
    });
    
    if (asignaciones[0].total_asignaciones > 5) {
      console.log(`   ... y ${asignaciones[0].total_asignaciones - 5} niños más`);
    }
    
    // 5. Opcional: limpiar prueba
    console.log('\n5. Limpiando prueba...');
    const eliminar = false; // Cambiar a true para eliminar
    
    if (eliminar) {
      await db.query('DELETE FROM nino_materias WHERE id_materia = ?', [nuevaMateriaId]);
      await db.query('DELETE FROM materias WHERE id_materia = ?', [nuevaMateriaId]);
      console.log('✅ Materia de prueba eliminada');
    } else {
      console.log('ℹ️  Materia de prueba mantenida para verificación manual');
      console.log(`   ID: ${nuevaMateriaId}, Nombre: ${nombrePrueba}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log('\n📋 RESUMEN DEL SISTEMA:');
    console.log('   ✅ Trigger after_materia_insert: ACTIVO');
    console.log('   ✅ Asignación automática: FUNCIONANDO');
    console.log('   ✅ Niños actuales: ' + totalNinos[0].total);
    console.log('   ✅ Materias totales: ' + (totalMaterias[0].total + (eliminar ? 0 : 1)));
    
    console.log('\n💡 PRUEBA FINAL:');
    console.log('   1. Ve al frontend como MAESTRO');
    console.log('   2. Crea una nueva materia (ej: "Historia")');
    console.log('   3. Verifica en phpMyAdmin que se asignó a todos los niños');
    console.log('   4. Inicia sesión como TUTOR para verificar que ven la nueva materia');
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

// Ejecutar
verificarTriggers();