import { firmanteInstitucional } from "../firmanteInstitucional";

// Las dos firmas del boletín impreso (docs/funcionalidades/FIRMAS_BOLETIN.md,
// paso 4): la del rector(a), sobre la raya "Director(a)", y la del director de
// grupo del curso. Las imágenes llegan con el boletín
// (`firma_institucional`, `firma_director_grupo`); `null` deja la raya vacía,
// para firmar a mano, como antes.
//
// Debajo de la raya: el nombre y el cargo cuando se saben. Sin nombre
// configurado, el texto de siempre ("Director(a)", "Director de Grupo").

export const ETIQUETA_DIRECTOR_GRUPO = "Director de Grupo";
export const CARGO_DIRECTOR_GRUPO = "Director(a) de grupo";

/** Las firmas para `DocumentoImprimible`: `[{ nombre, cargo?, imagen }]`. */
export function firmasDelBoletin(boletinData, branding) {
  const rector = firmanteInstitucional(branding);
  const director = String(boletinData?.director_grupo ?? "").trim();
  return [
    {
      ...(rector.nombre ? { nombre: rector.nombre, cargo: rector.cargo } : { nombre: rector.cargo }),
      imagen: boletinData?.firma_institucional || null,
    },
    {
      ...(director
        ? { nombre: director, cargo: CARGO_DIRECTOR_GRUPO }
        : { nombre: ETIQUETA_DIRECTOR_GRUPO }),
      imagen: boletinData?.firma_director_grupo || null,
    },
  ];
}

export const AVISO_SIN_FIRMA_RECTOR =
  "Este boletín sale sin la firma del rector(a). Para que salga firmado, súbela en Diseño de impresos → Identidad institucional.";

/** Lo que falta firmar, para avisarle al admin antes de imprimir (no sale en
 * el papel). Sin director de grupo asignado no hay a quién pedirle firma. */
export function avisosDeFirmas(boletinData) {
  const avisos = [];
  if (!boletinData?.firma_institucional) avisos.push(AVISO_SIN_FIRMA_RECTOR);
  const director = String(boletinData?.director_grupo ?? "").trim();
  if (director && !boletinData?.firma_director_grupo) {
    avisos.push(
      `Sale sin la firma del director de grupo (${director}). Cada director de grupo pone la suya desde «Mi curso».`,
    );
  }
  return avisos;
}
