// Cuentas puras del muro de cumpleaños (2026-11-11): los banderines y el
// camino del globo de hoy cuando se suelta y pasea por la pantalla. Sin DOM:
// las medidas llegan como números (píxeles de la pantalla).

// Una letra por banderín.
export const LETRAS_MURO = ["C", "U", "M", "P", "L", "E", "A", "Ñ", "O", "S"];

// Telas de los banderines: [color, sombra].
export const TELAS_BANDERIN = [
    ["#ec4899", "#9d174d"],
    ["#f59e0b", "#92400e"],
    ["#8b5cf6", "#5b21b6"],
    ["#0ea5e9", "#075985"],
    ["#10b981", "#065f46"],
];

// Borde de las letras al estilo de los títulos de anime: ocho sombras de un
// píxel alrededor, del color dado.
export const sombraContorno = (color) =>
    ["1px 0 0", "-1px 0 0", "0 1px 0", "0 -1px 0", "1px 1px 0", "-1px -1px 0", "1px -1px 0", "-1px 1px 0"]
        .map((desplazamiento) => `${desplazamiento} ${color}`)
        .join(", ");

// Cuánto se cuelga el cordón en el centro (px). La cuerda del muro se dibuja
// con la misma curva: 3 px arriba en los extremos y 3 + CAIDA_CORDON en medio.
export const CAIDA_CORDON = 10;

// Cada banderín cuelga del cordón: más abajo en el centro y ladeado según la
// pendiente del cordón en su punto.
export const banderinesMuro = (letras = LETRAS_MURO) =>
    letras.map((letra, indice) => {
        const t = (2 * indice + 1) / letras.length - 1;
        const [color, sombra] = TELAS_BANDERIN[indice % TELAS_BANDERIN.length];
        return {
            letra,
            color,
            sombra,
            caida: Number((2 + CAIDA_CORDON * (1 - t * t)).toFixed(1)),
            giro: Number((-t * 9).toFixed(1)) || 0,
        };
    });

// Velocidad del paseo, en píxeles por segundo.
export const VELOCIDAD_PASEO = 65;
export const DURACION_SOLTARSE = 6000;
const DURACION_PASEO_MINIMA = 30000;
const DURACION_PASEO_MAXIMA = 120000;
const MARGEN = 8;

const redondear = Math.round;

// Puntos al azar donde el globo cabe entero dentro del área. Alterna mitad
// izquierda y mitad derecha para que recorra todo el ancho. `azar` devuelve
// números entre 0 y 1 (en las pruebas, siempre los mismos).
export const puntosDePaseo = (area, tamano, azar = Math.random, cantidad = 6) => {
    const minX = area.izquierda + tamano.ancho / 2 + MARGEN;
    const maxX = Math.max(minX, area.derecha - tamano.ancho / 2 - MARGEN);
    const minY = area.arriba + tamano.alto / 2 + MARGEN;
    const maxY = Math.max(minY, area.abajo - tamano.alto / 2 - MARGEN);
    return Array.from({ length: cantidad }, (_, indice) => {
        const lado = indice % 2 === 0 ? azar() * 0.45 : 0.55 + azar() * 0.45;
        return [redondear(minX + (maxX - minX) * lado), redondear(minY + (maxY - minY) * azar())];
    });
};

// Curva suave y cerrada que pasa por todos los puntos (Catmull-Rom convertida
// a Bézier): termina donde empieza, así el paseo se repite sin saltos.
export const rutaCerrada = (puntos) => {
    if (puntos.length < 2) return "";
    const total = puntos.length;
    let ruta = `M ${puntos[0][0]} ${puntos[0][1]}`;
    for (let k = 0; k < total; k += 1) {
        const p0 = puntos[(k - 1 + total) % total];
        const p1 = puntos[k];
        const p2 = puntos[(k + 1) % total];
        const p3 = puntos[(k + 2) % total];
        const c1x = redondear(p1[0] + (p2[0] - p0[0]) / 6);
        const c1y = redondear(p1[1] + (p2[1] - p0[1]) / 6);
        const c2x = redondear(p2[0] - (p3[0] - p1[0]) / 6);
        const c2y = redondear(p2[1] - (p3[1] - p1[1]) / 6);
        ruta += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
    }
    return ruta;
};

// Del muro al primer punto del paseo: sale hacia arriba y llega suave.
export const rutaDeSoltar = (desde, hasta) => {
    const tiron = redondear(Math.abs(desde[1] - hasta[1]) * 0.45 + 60);
    return `M ${redondear(desde[0])} ${redondear(desde[1])} C ${redondear(desde[0])} ${redondear(desde[1] - tiron)} ${hasta[0]} ${hasta[1] + tiron} ${hasta[0]} ${hasta[1]}`;
};

// Cuánto tarda una vuelta completa a velocidad pareja, entre 30 s y 2 min.
export const duracionPaseo = (puntos) => {
    const largo = puntos.reduce((suma, punto, indice) => {
        const siguiente = puntos[(indice + 1) % puntos.length];
        return suma + Math.hypot(siguiente[0] - punto[0], siguiente[1] - punto[1]);
    }, 0);
    const milisegundos = redondear(((largo * 1.1) / VELOCIDAD_PASEO) * 1000);
    return Math.max(DURACION_PASEO_MINIMA, Math.min(DURACION_PASEO_MAXIMA, milisegundos));
};
