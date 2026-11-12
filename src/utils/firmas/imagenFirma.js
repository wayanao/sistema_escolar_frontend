// Firmas guardadas para el boletín (docs/funcionalidades/FIRMAS_BOLETIN.md):
// las reglas puras para convertir una foto o un trazo en la imagen que se
// guarda. Sin DOM ni canvas: trabajan sobre los píxeles (RGBA) que les pasa
// `hooks/firmas/lienzoFirma.js`.
//
// El resultado es siempre el mismo: solo la tinta, de un color oscuro parejo,
// sobre fondo transparente y recortada a lo que ocupa la firma. Así se apoya
// sobre la raya del boletín sin taparla y pesa pocos KB.

/** Lo máximo que acepta el servidor (100 KB), igual que la firma del acudiente. */
export const MAX_BYTES_FIRMA = 100 * 1024;

/** Tamaño máximo de la imagen guardada: de sobra para una firma impresa. */
export const ANCHO_MAXIMO_FIRMA = 900;
export const ALTO_MAXIMO_FIRMA = 300;

/** La foto se achica a esto antes de limpiarla: una de celular trae millones
 * de píxeles que no hacen falta. */
export const LADO_MAXIMO_PROCESO = 1600;

/** El color de la tinta guardada: el mismo del trazo del recuadro de firma. */
export const COLOR_TINTA = [15, 23, 42];

/** Aire alrededor de la firma recortada, en píxeles. */
export const MARGEN_FIRMA = 8;

// Más oscuro que el 70 % del papel de alrededor es tinta. "De alrededor" y no
// de toda la foto: con luz desigual o la sombra de la mano en una esquina, el
// papel de esa zona es más gris, y medido contra el de toda la foto pasaba por
// tinta (visto el 2026-11-12 con una foto de prueba).
const FRACCION_UMBRAL = 0.7;
// El papel de alrededor se mide por bloques de este lado (en la foto ya
// achicada): lo bastante grandes para que siempre haya papel en cada uno,
// lo bastante chicos para seguir una sombra.
const TAMANO_BLOQUE = 32;
// En cada bloque, el papel es el brillo que deja por debajo este tanto de los
// píxeles: la tinta es poca y oscura, así que lo de arriba es papel.
const PERCENTIL_PAPEL = 0.9;
// Con el papel de toda la foto por debajo de esto, la foto está oscura.
const PAPEL_MINIMO = 70;
// Por debajo de este tramo bajo el umbral, la tinta es del todo opaca; entre
// los dos, se va aclarando (bordes suaves, sin dientes).
const FRACCION_RAMPA = 0.35;
// Un píxel cuenta como tinta para el recorte desde esta opacidad.
const OPACIDAD_MINIMA_RECORTE = 64;

/**
 * En una foto, una mancha de tinta suelta más pequeña que esto (en píxeles de
 * la foto ya achicada a 1600) es polvo o una mota del papel, no firma: se
 * borra antes de recortar. El punto de una «i» hecho con lapicero suele pasar
 * de 20. Con un solo píxel suelto bastaba para estirar el recorte (visto el
 * 2026-11-12 con una foto de prueba). El trazo con el dedo no tiene motas, así
 * que ahí no se usa.
 */
export const AREA_MINIMA_MOTA = 16;
// Si más de esta parte de la foto es "tinta", la foto está oscura o no es de
// una firma sobre papel blanco.
const MAXIMA_FRACCION_TINTA = 0.3;

export const MENSAJE_SIN_FIRMA =
  "No se ve ninguna firma en la foto. Firma con lapicero oscuro en una hoja blanca y vuelve a intentarlo.";
export const MENSAJE_FOTO_OSCURA =
  "La foto está muy oscura o no es de una hoja blanca. Tómala de cerca, con buena luz, solo la firma sobre la hoja.";
export const MENSAJE_FIRMA_PESADA =
  "La firma quedó muy pesada. Tómale la foto más de cerca, solo a la firma, sobre una hoja blanca.";
export const MENSAJE_FOTO_ILEGIBLE =
  "No se pudo abrir esa imagen. Prueba con otra foto (JPG o PNG).";

/** El brillo de un color, de 0 (negro) a 255 (blanco). */
export function luminancia(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Lo transparente cuenta como blanco: es papel, no tinta.
function brilloDelPixel(pixeles, i) {
  if (pixeles[i + 3] < 128) return 255;
  return luminancia(pixeles[i], pixeles[i + 1], pixeles[i + 2]);
}

// El brillo bajo el que queda `fraccion` de los conteos de un histograma.
function percentil(histograma, total, fraccion) {
  let acumulado = 0;
  for (let brillo = 0; brillo < 256; brillo += 1) {
    acumulado += histograma[brillo];
    if (acumulado >= total * fraccion) return brillo;
  }
  return 255;
}

/** El brillo del papel de toda la foto: la mediana. Solo dice si la foto
 * está demasiado oscura; la tinta se decide con el papel de alrededor. */
export function brilloDelPapel(pixeles) {
  const histograma = new Array(256).fill(0);
  for (let i = 0; i < pixeles.length; i += 4) {
    histograma[Math.round(brilloDelPixel(pixeles, i))] += 1;
  }
  return percentil(histograma, pixeles.length / 4, 0.5);
}

/**
 * El brillo del papel en cada bloque de `TAMANO_BLOQUE` × `TAMANO_BLOQUE`.
 * Devuelve `{ fondos, columnas, filas }`; `fondos` va fila por fila.
 */
export function papelPorBloques(pixeles, ancho, alto, bloque = TAMANO_BLOQUE) {
  const columnas = Math.ceil(ancho / bloque);
  const filas = Math.ceil(alto / bloque);
  const fondos = new Array(columnas * filas);
  const histograma = new Array(256);
  for (let fila = 0; fila < filas; fila += 1) {
    for (let columna = 0; columna < columnas; columna += 1) {
      histograma.fill(0);
      const x0 = columna * bloque;
      const y0 = fila * bloque;
      const x1 = Math.min(ancho, x0 + bloque);
      const y1 = Math.min(alto, y0 + bloque);
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          histograma[Math.round(brilloDelPixel(pixeles, (y * ancho + x) * 4))] += 1;
        }
      }
      fondos[fila * columnas + columna] = percentil(
        histograma,
        (x1 - x0) * (y1 - y0),
        PERCENTIL_PAPEL,
      );
    }
  }
  return { fondos, columnas, filas, bloque };
}

// El papel bajo un píxel: mezcla suave de los cuatro bloques más cercanos,
// para que no se noten los bordes de los bloques.
function papelEn({ fondos, columnas, filas, bloque }, x, y) {
  const gx = Math.min(Math.max((x + 0.5) / bloque - 0.5, 0), columnas - 1);
  const gy = Math.min(Math.max((y + 0.5) / bloque - 0.5, 0), filas - 1);
  const c0 = Math.floor(gx);
  const f0 = Math.floor(gy);
  const c1 = Math.min(c0 + 1, columnas - 1);
  const f1 = Math.min(f0 + 1, filas - 1);
  const tx = gx - c0;
  const ty = gy - f0;
  const arriba = fondos[f0 * columnas + c0] * (1 - tx) + fondos[f0 * columnas + c1] * tx;
  const abajo = fondos[f1 * columnas + c0] * (1 - tx) + fondos[f1 * columnas + c1] * tx;
  return arriba * (1 - ty) + abajo * ty;
}

/**
 * Deja solo la tinta. Recibe los píxeles RGBA de la imagen y devuelve:
 *
 * - `pixeles`: otros píxeles del mismo tamaño, con la tinta en `COLOR_TINTA`
 *   y el papel transparente;
 * - `caja`: el rectángulo que ocupa la firma (`{x, y, ancho, alto}`);
 * - `error`: `MENSAJE_SIN_FIRMA` o `MENSAJE_FOTO_OSCURA` si no sirve (y
 *   entonces `caja` es `null`).
 *
 * `areaMinimaMota`: las manchas sueltas más pequeñas se borran (fotos); con 0
 * no se borra nada (trazo con el dedo).
 */
export function limpiarPixelesFirma(pixeles, ancho, alto, { areaMinimaMota = AREA_MINIMA_MOTA } = {}) {
  const limpios = new Uint8ClampedArray(pixeles.length);
  if (brilloDelPapel(pixeles) < PAPEL_MINIMO) {
    return { pixeles: limpios, caja: null, error: MENSAJE_FOTO_OSCURA };
  }
  const papel = papelPorBloques(pixeles, ancho, alto);

  for (let y = 0; y < alto; y += 1) {
    for (let x = 0; x < ancho; x += 1) {
      const i = (y * ancho + x) * 4;
      const brillo = brilloDelPixel(pixeles, i);
      const papelAqui = papelEn(papel, x, y);
      const umbral = papelAqui * FRACCION_UMBRAL;
      if (brillo >= umbral) continue;
      const rampa = Math.max(1, papelAqui * FRACCION_RAMPA);
      const opacidad = Math.round(255 * Math.min(1, (umbral - brillo) / rampa));
      limpios[i] = COLOR_TINTA[0];
      limpios[i + 1] = COLOR_TINTA[1];
      limpios[i + 2] = COLOR_TINTA[2];
      limpios[i + 3] = opacidad;
    }
  }

  if (areaMinimaMota > 0) quitarMotas(limpios, ancho, alto, areaMinimaMota);

  const tintaPorFila = new Array(alto).fill(0);
  const tintaPorColumna = new Array(ancho).fill(0);
  let pixelesDeTinta = 0;
  for (let y = 0; y < alto; y += 1) {
    for (let x = 0; x < ancho; x += 1) {
      if (limpios[(y * ancho + x) * 4 + 3] >= OPACIDAD_MINIMA_RECORTE) {
        tintaPorFila[y] += 1;
        tintaPorColumna[x] += 1;
        pixelesDeTinta += 1;
      }
    }
  }

  if (pixelesDeTinta > ancho * alto * MAXIMA_FRACCION_TINTA) {
    return { pixeles: limpios, caja: null, error: MENSAJE_FOTO_OSCURA };
  }
  const filas = lineasConTinta(tintaPorFila);
  const columnas = lineasConTinta(tintaPorColumna);
  if (!filas || !columnas) {
    return { pixeles: limpios, caja: null, error: MENSAJE_SIN_FIRMA };
  }
  return {
    pixeles: limpios,
    caja: {
      x: columnas.desde,
      y: filas.desde,
      ancho: columnas.hasta - columnas.desde + 1,
      alto: filas.hasta - filas.desde + 1,
    },
    error: null,
  };
}

function lineasConTinta(conteos) {
  const desde = conteos.findIndex((n) => n > 0);
  if (desde === -1) return null;
  let hasta = conteos.length - 1;
  while (conteos[hasta] === 0) hasta -= 1;
  return { desde, hasta };
}

/**
 * Borra (deja transparentes) las manchas de tinta sueltas con menos de
 * `areaMinima` píxeles fuertes. Una mancha son los píxeles con algo de tinta
 * que se tocan, también en diagonal; su borde suave se va con ella. Cambia
 * `limpios` en el sitio.
 */
export function quitarMotas(limpios, ancho, alto, areaMinima) {
  const total = ancho * alto;
  const visto = new Uint8Array(total);
  const pila = new Int32Array(total);
  const mancha = new Int32Array(total);

  for (let inicio = 0; inicio < total; inicio += 1) {
    if (visto[inicio] || limpios[inicio * 4 + 3] === 0) continue;
    // Recorre toda la mancha que empieza aquí.
    let enPila = 0;
    let enMancha = 0;
    let fuertes = 0;
    pila[enPila++] = inicio;
    visto[inicio] = 1;
    while (enPila > 0) {
      const p = pila[--enPila];
      mancha[enMancha++] = p;
      if (limpios[p * 4 + 3] >= OPACIDAD_MINIMA_RECORTE) fuertes += 1;
      const x = p % ancho;
      const y = (p - x) / ancho;
      for (let dy = -1; dy <= 1; dy += 1) {
        const ny = y + dy;
        if (ny < 0 || ny >= alto) continue;
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          if (nx < 0 || nx >= ancho) continue;
          const q = ny * ancho + nx;
          if (visto[q] || limpios[q * 4 + 3] === 0) continue;
          visto[q] = 1;
          pila[enPila++] = q;
        }
      }
    }
    if (fuertes >= areaMinima) continue;
    for (let k = 0; k < enMancha; k += 1) limpios[mancha[k] * 4 + 3] = 0;
  }
}

/**
 * El recorte con su margen, sin salirse de la imagen, y el tamaño final: cabe
 * en `ANCHO_MAXIMO_FIRMA` × `ALTO_MAXIMO_FIRMA` (por `escala`, para reintentar
 * más pequeño) y nunca se agranda.
 */
export function medidasDelRecorte(caja, anchoImagen, altoImagen, escala = 1) {
  const x = Math.max(0, caja.x - MARGEN_FIRMA);
  const y = Math.max(0, caja.y - MARGEN_FIRMA);
  const ancho = Math.min(anchoImagen, caja.x + caja.ancho + MARGEN_FIRMA) - x;
  const alto = Math.min(altoImagen, caja.y + caja.alto + MARGEN_FIRMA) - y;
  const factor = Math.min(1, (ANCHO_MAXIMO_FIRMA * escala) / ancho, (ALTO_MAXIMO_FIRMA * escala) / alto);
  return {
    origen: { x, y, ancho, alto },
    final: {
      ancho: Math.max(1, Math.round(ancho * factor)),
      alto: Math.max(1, Math.round(alto * factor)),
    },
  };
}

/** Cuánto pesa la imagen de un `data:...;base64,` una vez decodificada. */
export function bytesDeDataUrl(dataUrl) {
  const base64 = String(dataUrl || "").split(",")[1] || "";
  const relleno = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - relleno;
}

/** «12 de noviembre de 2026», o "" si no hay fecha. */
export function formatearFechaFirma(iso) {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

/** El mensaje de un fallo al guardar o quitar una firma. Los textos del
 * servidor ya están en español; un 422 llega como lista y se traduce aquí. */
export function mensajeErrorFirmaGuardada(error, porDefecto) {
  const detalle = error?.response?.data?.detail;
  if (typeof detalle === "string" && detalle.trim()) return detalle;
  if (Array.isArray(detalle)) {
    const primero = detalle.find((d) => typeof d?.msg === "string")?.msg;
    if (primero) return primero.replace(/^Value error,\s*/i, "");
  }
  return porDefecto;
}
