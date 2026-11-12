import { useState } from "react";

// Base y punta de cada dedo: se dibujan como trazos gruesos con puntas
// redondas, primero oscuros (el contorno) y luego amarillos encima.
const DEDOS = [
  [23, 46, 11, 34], // pulgar
  [25, 32, 21, 13], // índice
  [33, 31, 32, 9], // corazón
  [41, 31, 44, 12], // anular
  [48, 33, 53, 19], // meñique
];
const ANCHO_DEDO = 8.5;
const CONTORNO = 5;
const PALMA = "M20 35 C20 29.5 23.5 27 28 27 H46 C50 27 52.5 30 52.5 34 V43 C52.5 51 46.5 57 38 57 H34 C26 57 20 51 20 43 Z";

function Mano({ claseRelleno, claseTrazo, grosor }) {
  return (
    <>
      <path d={PALMA} className={claseRelleno} strokeWidth={grosor - ANCHO_DEDO} strokeLinejoin="round" />
      {DEDOS.map(([x1, y1, x2, y2]) => (
        <line key={`${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} className={claseTrazo} strokeWidth={grosor} strokeLinecap="round" />
      ))}
    </>
  );
}

/**
 * Manito de caricatura que saluda junto al nombre (pedido del usuario el
 * 2026-11-12: «ponle una manito al nombre del admin como una caricatura»).
 * Saluda al abrir el panel y otra vez al pasarle el ratón o tocarla; con
 * «reducir movimiento» se queda quieta. Es un adorno: los lectores de pantalla
 * la saltan y el título sigue siendo «Hola, Carlos».
 */
function ManitoSaludo({ className = "" }) {
  // Cada número nuevo vuelve a montar el dibujo y así repite el saludo.
  const [saludos, setSaludos] = useState(0);

  return (
    <svg
      key={saludos}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      data-testid="manito-saludo"
      onMouseEnter={() => setSaludos((cuenta) => cuenta + 1)}
      className={`inline-block overflow-visible ${className}`}
    >
      <g className="manito-rayas fill-none stroke-purple-600" strokeWidth="2.6" strokeLinecap="round">
        <path d="M6 18 Q3 22 5 27" />
        <path d="M11 9 Q7 12 7 17" />
        <path d="M57 6 Q61 9 61 14" />
        <path d="M60 22 Q63 25 62 30" />
      </g>
      <g className="manito-saludo">
        {/* Contorno: las mismas formas, oscuras y más gruesas. */}
        <Mano claseRelleno="fill-purple-950 stroke-purple-950" claseTrazo="stroke-purple-950" grosor={ANCHO_DEDO + CONTORNO} />
        {/* La mano, amarilla como un dibujo animado. */}
        <Mano claseRelleno="fill-amber-300 stroke-amber-300" claseTrazo="stroke-amber-300" grosor={ANCHO_DEDO} />
        <path d="M27 45 Q31.5 50 38 49.5" className="fill-none stroke-purple-950" strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
        <ellipse cx="31.5" cy="15" rx="1.5" ry="3.2" className="fill-white" opacity="0.75" />
        {/* La mangita morada. */}
        <rect x="26" y="52" width="19" height="10" rx="3" className="fill-purple-600 stroke-purple-950" strokeWidth="2.5" />
        <path d="M28.5 56.5 H42.5" className="stroke-purple-300" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export default ManitoSaludo;
