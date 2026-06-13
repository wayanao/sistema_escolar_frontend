# Arquitectura Frontend

Estado documentado del frontend `frontend-react`.

## Stack actual

- React 19.
- React Router DOM 7.
- Vite 8.
- Axios para consumo del backend.
- SweetAlert2 para alertas.
- js-cookie para lectura/eliminacion de cookie `token`.
- jsPDF y jspdf-autotable para impresos/reportes.
- pnpm como gestor obligatorio del proyecto.

## Estructura raiz observada

- `src/`: codigo fuente de React.
- `public/`: archivos publicos servidos por Vite.
- `dist/`: salida generada por build.
- `docs/`: documentacion de control del frontend.
- `scripts/`: scripts auxiliares del proyecto.
- `index.html`: entrada HTML de Vite.
- `vite.config.js`: configuracion de Vite con plugin React.
- `vercel.json`: reescritura SPA hacia `index.html`.
- `.env`: variables de entorno locales.
- `package.json`: scripts, dependencias y version de pnpm.

## Estructura de `src/`

- `src/main.jsx`: monta React en el DOM y envuelve `App` con `BrowserRouter`.
- `src/App.jsx`: define rutas, layouts, lazy loading y guards principales.
- `src/assets/`: imagenes y recursos estaticos del frontend.
- `src/components/`: componentes reutilizables y componentes por modulo.
- `src/components/admin/`: componentes administrativos de branding/plantillas.
- `src/components/boletin/`: componentes del modulo de boletines.
- `src/components/cartera/`: componentes del modulo de cartera.
- `src/components/impresion/`: componentes de documentos imprimibles.
- `src/constants/`: constantes compartidas entre paginas/componentes.
- `src/hooks/`: hooks propios del frontend.
- `src/pages/`: paginas principales de la aplicacion.
- `src/services/`: servicios de frontend.
- `src/styles/`: estilos globales adicionales.
- `src/utils/`: utilidades compartidas, incluyendo cliente API.

## Entrada de la aplicacion

`src/main.jsx` renderiza:

- `BrowserRouter`
- `App`

`src/App.jsx` carga varias paginas con `React.lazy` y usa `Suspense` con un loader simple de texto `Cargando...`.

## Layout principal

La aplicacion tiene una ruta superior:

- `/login`: pantalla de login.
- `/*`: layout autenticado.

El layout autenticado lee `usuario` y `profesor` desde `localStorage`.

- Si existe `usuario` con rol `admin`, muestra `NavAdmin`.
- Si no, muestra `NavProfesor`.
- Si no existe ningun usuario/profesor en sesion, redirige a `/login`.

## Criterios de UX responsive

- Los ajustes moviles se concentran en clases responsive de Tailwind y en
  `src/styles/print.css`.
- En documentos imprimibles, la regla general es:
  - documentos comunes se adaptan al ancho de pantalla;
  - boletin, certificados y cartera mantienen formato A4 (`210mm`) y usan
    scroll horizontal en movil.
- `DocumentoImprimible` es el punto de entrada para toolbar, branding,
  encabezado, firmas, pie de pagina y comportamiento especial por documento.
- `NavAdmin` mantiene grupos colapsables en movil para reducir ruido visual y
  diferenciar subpestanas de enlaces principales.
- `NavAdmin` marca etiquetas sensibles como `Nómina` con `translate="no"` para
  evitar traducciones automaticas en Android/Chrome.
- `NavProfesor` mantiene grupos moviles para control academico y planeacion.
- `Planilla` usa vista de tarjetas en movil y tabla en escritorio; las etiquetas
  tecnicas se formatean y se protegen con `translate="no"`.
- `IngresoBoletinProfesor` reutiliza el criterio de planilla: oculta notas
  internas y evita traduccion automatica de tipos de nota.
- `Asistencia` muestra estados de carga/reintento para historial y aviso cuando
  la asistencia de la fecha ya fue tomada.
- `Observaciones` acota la verificacion inicial para evitar estados
  `Verificando` indefinidos en conexiones moviles lentas.
- `EstudiantesAdmin` mantiene el observador dentro del modal de detalle; la UI
  movil usa tarjetas apiladas y la UI de escritorio conserva disposicion amplia.

## Convenciones actuales

- Para textos guardados por usuarios o etiquetas academicas que no deben ser
  traducidas por el navegador, usar `translate="no"`.
- Las columnas internas o tecnicas, como `mas_alto`, no deben mostrarse al
  usuario final.
- Las mejoras moviles deben conservar la experiencia de escritorio salvo que el
  cambio sea explicitamente solicitado para ambas vistas.
- Los documentos imprimibles que representan formatos A4 deben conservar ancho
  fijo y usar scroll horizontal en pantalla movil.

## Build

Los scripts actuales de `package.json` son:

- `pnpm run dev`: inicia Vite.
- `pnpm run build`: ejecuta `vite build`.
- `pnpm run lint`: ejecuta ESLint.
- `pnpm run preview`: sirve el build con Vite preview.

El proyecto fuerza el uso de pnpm mediante scripts `preinstall`, `predev`, `prebuild`, `prelint` y `prepreview`.
