// utils/pdfUtils.ts

/**
 * Utilidades para limpiar texto en PDFs (Frontend)
 */

/**
 * Limpia texto para que sea compatible con WinAnsi encoding
 * Convierte caracteres especiales a sus equivalentes ASCII
 */
export function limpiarTextoWinAnsi(texto: string): string {
    if (!texto) return '';
    
    // Mapa de caracteres especiales a ASCII
    const replacements: { [key: string]: string } = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
        'ä': 'a', 'ë': 'e', 'ï': 'i', 'ö': 'o', 'ü': 'u',
        'Ä': 'A', 'Ë': 'E', 'Ï': 'I', 'Ö': 'O', 'Ü': 'U',
        'ñ': 'n', 'Ñ': 'N',
        'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u',
        'â': 'a', 'ê': 'e', 'î': 'i', 'ô': 'o', 'û': 'u',
        'ç': 'c', 'Ç': 'C',
        'ÿ': 'y', 'Ÿ': 'Y',
        'ß': 'ss',
        'œ': 'oe', 'Œ': 'OE',
        'æ': 'ae', 'Æ': 'AE',
        '¿': '?', '¡': '!',
        '«': '"', '»': '"',
        '“': '"', '”': '"',
        '‘': "'", '’': "'",
        '—': '-', '–': '-'
    };
    
    let resultado = '';
    for (let char of texto) {
        if (replacements[char] !== undefined) {
            resultado += replacements[char];
        } else if (/^[\x00-\x7F]$/.test(char)) {
            resultado += char;
        } else {
            // Intentar normalizar
            const normalizado = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (/^[\x00-\x7F]$/.test(normalizado)) {
                resultado += normalizado;
            } else {
                resultado += ' ';
            }
        }
    }
    
    return resultado.replace(/\s+/g, ' ').trim();
}

/**
 * Limpia texto para PDF pero mantiene MAYÚSCULAS
 */
export function limpiarTextoMayusculas(texto: string): string {
    return limpiarTextoWinAnsi(texto).toUpperCase();
}

/**
 * Versión mejorada para nombres propios
 */
export function limpiarNombrePropio(texto: string): string {
    if (!texto) return '';
    const limpio = limpiarTextoWinAnsi(texto);
    return limpio.split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Crea un nombre de archivo seguro
 */
export function crearNombreArchivoSeguro(nombreBase: string, extension: string = 'pdf'): string {
    if (!nombreBase) return `certificado.${extension}`;
    const limpio = limpiarTextoWinAnsi(nombreBase)
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
    return `${limpio}.${extension}`;
}