// C:\Codigos\HTml\AlexisE-SDaeli-main\AlexisE-SDaeli-main\backend\utils\pdfUtils.js

/**
 * Utilidades para limpiar texto en PDFs
 * Soluciona el error "WinAnsi cannot encode" para caracteres especiales
 */

/**
 * Limpia texto para que sea compatible con WinAnsi encoding
 * Convierte caracteres especiales a sus equivalentes ASCII
 * 
 * @param {string} texto - Texto a limpiar
 * @returns {string} - Texto limpio sin caracteres especiales
 */
function limpiarTextoWinAnsi(texto) {
    if (!texto) return '';
    
    // Convertir a string
    let limpio = String(texto);
    
    // Mapa de caracteres especiales a ASCII
    const replacements = {
        // Vocales con acentos
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
        
        // Vocales con diéresis
        'ä': 'a', 'ë': 'e', 'ï': 'i', 'ö': 'o', 'ü': 'u',
        'Ä': 'A', 'Ë': 'E', 'Ï': 'I', 'Ö': 'O', 'Ü': 'U',
        
        // Eñes
        'ñ': 'n', 'Ñ': 'N',
        
        // Vocales con acento grave
        'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u',
        'À': 'A', 'È': 'E', 'Ì': 'I', 'Ò': 'O', 'Ù': 'U',
        
        // Vocales con acento circunflejo
        'â': 'a', 'ê': 'e', 'î': 'i', 'ô': 'o', 'û': 'u',
        'Â': 'A', 'Ê': 'E', 'Î': 'I', 'Ô': 'O', 'Û': 'U',
        
        // Cedillas
        'ç': 'c', 'Ç': 'C',
        
        // Otras letras
        'ÿ': 'y', 'Ÿ': 'Y',
        'ß': 'ss',
        'œ': 'oe', 'Œ': 'OE',
        'æ': 'ae', 'Æ': 'AE',
        
        // Signos de puntuación especiales
        '¿': '?', '¡': '!',
        '«': '"', '»': '"',
        '“': '"', '”': '"',
        '‘': "'", '’': "'",
        '—': '-', '–': '-'
    };
    
    // Aplicar reemplazos carácter por carácter
    let resultado = '';
    for (let char of limpio) {
        if (replacements[char] !== undefined) {
            // Si tiene reemplazo directo, usarlo
            resultado += replacements[char];
        } else if (/^[\x00-\x7F]$/.test(char)) {
            // Si ya es ASCII, mantenerlo
            resultado += char;
        } else {
            // Intentar normalizar y quitar diacríticos
            try {
                const normalizado = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (/^[\x00-\x7F]$/.test(normalizado)) {
                    resultado += normalizado;
                } else {
                    // Si aún no es ASCII, reemplazar con espacio
                    resultado += ' ';
                }
            } catch (e) {
                // Si falla la normalización, usar espacio
                resultado += ' ';
            }
        }
    }
    
    // Limpiar espacios múltiples y espacios al inicio/final
    return resultado.replace(/\s+/g, ' ').trim();
}

/**
 * Limpia texto para PDF pero mantiene MAYÚSCULAS
 * Útil para nombres propios en títulos
 * 
 * @param {string} texto - Texto a limpiar
 * @returns {string} - Texto limpio en mayúsculas
 */
function limpiarTextoMayusculas(texto) {
    return limpiarTextoWinAnsi(texto).toUpperCase();
}

/**
 * Versión mejorada para nombres propios
 * Primera letra de cada palabra en mayúscula, el resto en minúscula
 * 
 * @param {string} texto - Texto a limpiar
 * @returns {string} - Texto limpio con formato de nombre propio
 */
function limpiarNombrePropio(texto) {
    if (!texto) return '';
    
    const limpio = limpiarTextoWinAnsi(texto);
    
    return limpio.split(' ')
        .map(palabra => {
            if (palabra.length === 0) return '';
            // Casos especiales: palabras que deben ir completamente en mayúsculas
            const palabrasEspeciales = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
            if (palabrasEspeciales.includes(palabra.toUpperCase())) {
                return palabra.toUpperCase();
            }
            // Formato normal: primera letra mayúscula, resto minúscula
            return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
        })
        .join(' ');
}

/**
 * Limpia un número de teléfono para el PDF
 * Elimina caracteres no numéricos
 * 
 * @param {string} telefono - Número de teléfono
 * @returns {string} - Teléfono limpio
 */
function limpiarTelefono(telefono) {
    if (!telefono) return '';
    const limpio = String(telefono).replace(/[^\d+]/g, '');
    return limpio;
}

/**
 * Limpia una fecha para el PDF
 * Asegura que la fecha solo contenga caracteres ASCII
 * 
 * @param {string} fecha - Fecha en cualquier formato
 * @returns {string} - Fecha limpia
 */
function limpiarFecha(fecha) {
    if (!fecha) return '';
    return limpiarTextoWinAnsi(fecha);
}

/**
 * Limpia un ciclo escolar (ej: 2025-2026)
 * Asegura que solo contenga números y guiones
 * 
 * @param {string} ciclo - Ciclo escolar
 * @returns {string} - Ciclo limpio
 */
function limpiarCicloEscolar(ciclo) {
    if (!ciclo) return '2025-2026';
    const limpio = String(ciclo).replace(/[^\d-]/g, '');
    return limpio || '2025-2026';
}

/**
 * Limpia un promedio para el PDF
 * Asegura formato numérico válido
 * 
 * @param {number|string} promedio - Promedio
 * @returns {string} - Promedio formateado
 */
function formatearPromedio(promedio) {
    if (promedio === null || promedio === undefined) return '0.00';
    const num = parseFloat(promedio);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
}

/**
 * Crea un nombre de archivo seguro para el PDF
 * 
 * @param {string} nombreBase - Nombre base del archivo
 * @param {string} extension - Extensión (por defecto 'pdf')
 * @returns {string} - Nombre de archivo seguro
 */
function crearNombreArchivoSeguro(nombreBase, extension = 'pdf') {
    if (!nombreBase) return `certificado.${extension}`;
    
    const limpio = limpiarTextoWinAnsi(nombreBase)
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
    
    return `${limpio}.${extension}`;
}

// ========================================
// EXPORTAR TODAS LAS FUNCIONES
// ========================================
module.exports = {
    limpiarTextoWinAnsi,
    limpiarTextoMayusculas,
    limpiarNombrePropio,
    limpiarTelefono,
    limpiarFecha,
    limpiarCicloEscolar,
    formatearPromedio,
    crearNombreArchivoSeguro
};