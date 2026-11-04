// Iconos de línea del menú lateral, dibujados aquí para no sumar dependencias,
// como los de la landing. Son decorativos: el texto de al lado ya dice lo mismo.
const TRAZOS = {
  dashboard: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  academica: (
    <>
      <path d="M12 4 3 8.5l9 4.5 9-4.5L12 4z" />
      <path d="M7 10.75V15c0 1.5 2.25 3 5 3s5-1.5 5-3v-4.25M21 8.5V13" />
    </>
  ),
  cartera: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3.5" />
      <path d="M4 7.5V18a2 2 0 0 0 2 2h14V8.5H6.5A2.5 2.5 0 0 1 4 7.5z" />
      <circle cx="16" cy="14.25" r="1.25" />
    </>
  ),
  administracion: (
    <>
      <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  estudiantes: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.75a3 3 0 0 1 0 5.5M17.75 14.5A5.5 5.5 0 0 1 20.5 19" />
    </>
  ),
  reportes: <path d="M4 4v16h16M8 16v-4M12 16V8M16 16v-6" />,
  // Los controles del propio menú.
  abajo: <path d="m6 9 6 6 6-6" />,
  derecha: <path d="m9 6 6 6-6 6" />,
  panel: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
  salir: <path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3M16 16l4-4-4-4M20 12H9" />,
  arribaAbajo: <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />,
};

function IconoMenu({ nombre, className = "h-5 w-5 shrink-0" }) {
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

export default IconoMenu;
