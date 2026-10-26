// Iconos de línea de la landing, dibujados aquí para no sumar dependencias.
// Son decorativos: el texto de al lado ya dice lo mismo.
const TRAZOS = {
  boletin: (
    <>
      <path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  cartera: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3.5" />
      <path d="M4 7.5V18a2 2 0 0 0 2 2h14V8.5H6.5A2.5 2.5 0 0 1 4 7.5z" />
      <circle cx="16" cy="14.25" r="1.25" />
    </>
  ),
  tabla: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M3.5 14.5h17M9.5 4.5v15" />
    </>
  ),
  estudiante: (
    <>
      <path d="M12 4 3 8.5l9 4.5 9-4.5L12 4z" />
      <path d="M7 10.75V15c0 1.5 2.25 3 5 3s5-1.5 5-3v-4.25M21 8.5V13" />
    </>
  ),
  candado: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  personas: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.75a3 3 0 0 1 0 5.5M17.75 14.5A5.5 5.5 0 0 1 20.5 19" />
    </>
  ),
  navegador: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="M3 9h18M6.5 6.75h.01M9 6.75h.01" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  flecha: <path d="M5 12h14M13 6l6 6-6 6" />,
  mas: <path d="M12 5v14M5 12h14" />,
};

function IconoLanding({ nombre, className = "h-6 w-6" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {TRAZOS[nombre]}
    </svg>
  );
}

export default IconoLanding;
