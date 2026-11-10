// Dibujos de niños y útiles escolares para la barra de cada jornada del
// horario (pedido del usuario el 2026-11-10: «solo a esto»). Son adorno:
// van detrás del texto y los lectores de pantalla no los leen.
//
// Los colores van pensados para las barras pastel (durazno y lavanda).
//
// La escena mide 280 × 64. En pantallas angostas se ve solo su final (las
// dos o tres figuras de la derecha) para no tapar el título.

const PIEL = "#fcd5b5";
const LINEA = "#1e293b";

function Nino({ x, y, s = 1, cuerpo, pelo, saluda = false }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-4 18 L-5 30 M4 18 L5 30" stroke={LINEA} strokeWidth="3" strokeLinecap="round" />
      <path d="M-8 4 Q0 0 8 4 L7 19 L-7 19 Z" fill={cuerpo} />
      <path
        d={saluda ? "M-8 6 L-13 15 M8 6 L14 -3" : "M-8 6 L-12 16 M8 6 L12 16"}
        stroke={PIEL}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="0" cy="-5" r="7" fill={PIEL} />
      <path d="M-7.2 -5.5 Q-6 -13.5 0 -13 Q6 -13.5 7.2 -5.5 Q4 -9.5 0 -9.5 Q-4 -9.5 -7.2 -5.5 Z" fill={pelo} />
      <circle cx="-2.5" cy="-5" r="0.95" fill={LINEA} />
      <circle cx="2.5" cy="-5" r="0.95" fill={LINEA} />
      <path d="M-2.6 -1.8 Q0 0.6 2.6 -1.8" stroke={LINEA} strokeWidth="1" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Morral({ x, y, color }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M3 2 Q8 -5 13 2" stroke={LINEA} strokeWidth="1.6" fill="none" />
      <rect x="0" y="2" width="16" height="18" rx="4" fill={color} />
      <rect x="3" y="11" width="10" height="6" rx="1.5" fill="#ffffff" opacity="0.55" />
    </g>
  );
}

function Destello({ x, y, s = 1, color }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 -5 L1.3 -1.3 L5 0 L1.3 1.3 L0 5 L-1.3 1.3 L-5 0 L-1.3 -1.3 Z"
      fill={color}
    />
  );
}

function EscenaManana() {
  return (
    <>
      <Destello x={14} y={14} s={0.9} color="#fb923c" />
      <g transform="translate(14 46) rotate(-30)">
        <rect x="0" y="-4" width="34" height="8" rx="1" fill="#fde047" stroke="#78350f" strokeWidth="1" />
        <rect x="-6" y="-4" width="7" height="8" rx="1" fill="#f9a8d4" stroke="#78350f" strokeWidth="1" />
        <path d="M34 -4 L42 0 L34 4 Z" fill="#fde7c7" stroke="#78350f" strokeWidth="1" />
        <path d="M39.4 -1.3 L42 0 L39.4 1.3 Z" fill={LINEA} />
      </g>
      <g transform="translate(72 50)">
        <circle r="7" fill="#ef4444" />
        <path d="M0 -6 Q1 -10 3 -11" stroke="#78350f" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M1 -8 Q6 -12 8 -7 Q4 -6 1 -8 Z" fill="#22c55e" />
      </g>
      <Nino x={104} y={30} cuerpo="#3b82f6" pelo="#78350f" saluda />
      <Morral x={84} y={34} color="#f97316" />
      <Destello x={128} y={12} s={0.7} color="#fb923c" />
      <Nino x={146} y={33} s={0.88} cuerpo="#ec4899" pelo="#1e293b" />
      <g transform="translate(166 44)">
        <path d="M0 0 Q10 -4 20 0 L20 14 Q10 10 0 14 Z" fill="#60a5fa" />
        <path d="M20 0 Q30 -4 40 0 L40 14 Q30 10 20 14 Z" fill="#93c5fd" />
        <path d="M20 0 V14" stroke="#1e3a8a" strokeWidth="1" />
      </g>
      <g transform="translate(214 42)">
        <rect width="17" height="17" rx="2.5" fill="#8b5cf6" />
        <text x="8.5" y="13" fontSize="12" fontWeight="800" textAnchor="middle" fill="#ffffff" fontFamily="sans-serif">A</text>
      </g>
      <Destello x={240} y={16} s={0.8} color="#fb923c" />
      <Nino x={256} y={30} cuerpo="#16a34a" pelo="#b45309" saluda />
    </>
  );
}

function EscenaTarde() {
  return (
    <>
      <Destello x={12} y={12} s={0.8} color="#f59e0b" />
      <Destello x={44} y={22} s={0.55} color="#f59e0b" />
      <g transform="translate(18 36)">
        <path d="M0 8 L30 0 L14 14 Z" fill="#93c5fd" />
        <path d="M14 14 L30 0 L18 18 Z" fill="#60a5fa" />
      </g>
      <Destello x={70} y={14} s={0.6} color="#a78bfa" />
      <Nino x={100} y={30} cuerpo="#f97316" pelo="#1e293b" saluda />
      <g transform="translate(124 52)">
        <circle r="7" fill="#facc15" />
        <path d="M-7 0 Q0 -5 7 0 M-4 -5.5 Q0 0 -4 5.5" stroke="#b45309" strokeWidth="1.2" fill="none" />
      </g>
      <Morral x={140} y={38} color="#a78bfa" />
      <g transform="translate(166 54) rotate(-12)">
        <rect width="40" height="8" rx="1" fill="#fde68a" />
        <path d="M5 0 V4 M10 0 V3 M15 0 V4 M20 0 V3 M25 0 V4 M30 0 V3 M35 0 V4" stroke="#92400e" strokeWidth="1" />
      </g>
      <Destello x={222} y={10} s={0.9} color="#f59e0b" />
      <Nino x={252} y={30} cuerpo="#8b5cf6" pelo="#78350f" />
      <Destello x={274} y={22} s={0.55} color="#a78bfa" />
    </>
  );
}

function DibujosJornada({ jornada }) {
  const Escena = jornada === "Tarde" ? EscenaTarde : EscenaManana;
  return (
    // Alto fijo, pegado abajo: aunque la barra crezca (título en varias
    // líneas en celular) el dibujo no invade el texto.
    <span className="pointer-events-none absolute bottom-0 right-2 flex items-end" aria-hidden="true">
      <svg viewBox="168 0 112 64" className="h-16 w-auto xl:hidden" preserveAspectRatio="xMaxYMax meet">
        <Escena />
      </svg>
      <svg viewBox="0 0 280 64" className="hidden h-20 w-auto xl:block" preserveAspectRatio="xMaxYMax meet">
        <Escena />
      </svg>
    </span>
  );
}

export default DibujosJornada;
