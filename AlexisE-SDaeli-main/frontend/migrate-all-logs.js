const fs = require('fs');
const path = require('path');

// Configuración
const SRC_PATH = './src/app';
const LOGGER_IMPORT = "import { LoggingService } from '../services/logging.service';"; // ← Ruta CORREGIDA
const LOGGER_INJECT = 'private logger: LoggingService';

// Contadores
let filesModified = 0;
let totalChanges = 0;
let errors = [];

// Función para obtener la ruta relativa correcta al logging.service
function getRelativePath(filePath) {
    const relativeToSrc = path.relative(path.dirname(filePath), path.join(process.cwd(), 'src/app/services/logging.service'));
    return relativeToSrc.replace(/\\/g, '/');
}

// Función para convertir console.log a this.logger.log
function convertFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        let changes = 0;

        // Verificar si es un componente (tiene @Component)
        const isComponent = content.includes('@Component(');
        if (!isComponent) {
            return { modified: false, changes: 0 };
        }

        // Verificar si ya está migrado
        if (content.includes('LoggingService') && content.includes('logger:')) {
            // Ya tiene el servicio, solo reemplazar console.log
            const logPatterns = [
                { pattern: /console\.log\((.*?)\);?/gs, replacement: 'this.logger.log($1);' },
                { pattern: /console\.info\((.*?)\);?/gs, replacement: 'this.logger.info($1);' },
                { pattern: /console\.warn\((.*?)\);?/gs, replacement: 'this.logger.warn($1);' },
                { pattern: /console\.error\((.*?)\);?/gs, replacement: 'this.logger.error($1);' }
            ];
            
            logPatterns.forEach(({ pattern, replacement }) => {
                const matches = content.match(pattern);
                if (matches) {
                    content = content.replace(pattern, replacement);
                    changes += matches.length;
                    modified = true;
                }
            });
            
            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
                filesModified++;
                totalChanges += changes;
                console.log(`✅ ${path.basename(filePath)} - ${changes} cambios (actualizado)`);
            }
            return { modified, changes };
        }

        // 1. Agregar import de LoggingService
        const lines = content.split('\n');
        let lastImportIndex = -1;
        
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].trim().startsWith('import ') && !lines[i].includes('LoggingService')) {
                lastImportIndex = i;
                break;
            }
        }
        
        if (lastImportIndex !== -1) {
            const relativePath = getRelativePath(filePath);
            const newImport = `import { LoggingService } from '${relativePath}';`;
            lines.splice(lastImportIndex + 1, 0, newImport);
            content = lines.join('\n');
            modified = true;
            changes++;
        }

        // 2. Agregar logger al constructor
        if (!content.includes('logger:') && content.includes('constructor(')) {
            const constructorRegex = /constructor\s*\(([^)]*)\)/;
            const match = content.match(constructorRegex);
            
            if (match) {
                const params = match[1];
                if (!params.includes('logger:')) {
                    const newParams = params.trim() 
                        ? `${params}, ${LOGGER_INJECT}` 
                        : LOGGER_INJECT;
                    content = content.replace(constructorRegex, `constructor(${newParams})`);
                    modified = true;
                    changes++;
                }
            }
        }

        // 3. Reemplazar console.log por this.logger.log
        const logPatterns = [
            { pattern: /console\.log\((.*?)\);?/gs, replacement: 'this.logger.log($1);' },
            { pattern: /console\.info\((.*?)\);?/gs, replacement: 'this.logger.info($1);' },
            { pattern: /console\.warn\((.*?)\);?/gs, replacement: 'this.logger.warn($1);' },
            { pattern: /console\.error\((.*?)\);?/gs, replacement: 'this.logger.error($1);' },
            { pattern: /console\.group\((.*?)\);?/gs, replacement: 'this.logger.group($1);' },
            { pattern: /console\.groupEnd\(\);/g, replacement: 'this.logger.groupEnd();' },
            { pattern: /console\.table\((.*?)\);?/gs, replacement: 'this.logger.table($1);' }
        ];

        logPatterns.forEach(({ pattern, replacement }) => {
            const matches = content.match(pattern);
            if (matches) {
                content = content.replace(pattern, replacement);
                changes += matches.length;
                modified = true;
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            filesModified++;
            totalChanges += changes;
            console.log(`✅ ${path.basename(filePath)} - ${changes} cambios (nuevo)`);
        }

        return { modified, changes };
    } catch (error) {
        errors.push({ file: path.basename(filePath), error: error.message });
        console.error(`❌ ${path.basename(filePath)}:`, error.message);
        return { modified: false, changes: 0 };
    }
}

// Función para recorrer archivos
function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            processDirectory(filePath);
        } else if (file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.includes('logging.service')) {
            convertFile(filePath);
        }
    }
}

// Iniciar migración
console.log('\n🚀 INICIANDO MIGRACIÓN MASIVA DE LOGS\n');
console.log('📁 Escaneando:', SRC_PATH);
console.log('=' .repeat(60) + '\n');

processDirectory(SRC_PATH);

console.log('\n' + '=' .repeat(60));
console.log('📊 RESUMEN FINAL:');
console.log(`   📁 Archivos modificados: ${filesModified}`);
console.log(`   🔄 Cambios totales: ${totalChanges}`);
console.log(`   ❌ Errores: ${errors.length}`);

if (errors.length > 0) {
    console.log('\n⚠️ ARCHIVOS CON ERRORES:');
    errors.forEach(err => {
        console.log(`   - ${err.file}: ${err.error}`);
    });
}

console.log('\n✨ MIGRACIÓN COMPLETADA!');
console.log('\n💡 PRÓXIMOS PASOS:');
console.log('   1. Ejecuta: ng serve');
console.log('   2. Verifica que no haya errores');
console.log('   3. Los logs deberían aparecer en desarrollo');
console.log('   4. Prueba: ng serve --configuration=production (logs ocultos)\n');