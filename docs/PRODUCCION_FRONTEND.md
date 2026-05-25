# Produccion Frontend

Estado actual de preparacion para produccion del frontend.

## Variables de entorno

Archivo observado:

- `.env`

Variable usada:

```text
VITE_API_URL=http://localhost:8000
```

Esta variable es usada por:

- `src/utils/api.js`
- servicios o paginas que leen `import.meta.env.VITE_API_URL`

## Build

Comando actual:

```text
pnpm run build
```

El script ejecuta:

```text
vite build
```

La salida generada se ubica en:

```text
dist/
```

## Preview local

Comando actual:

```text
pnpm run preview
```

El script ejecuta:

```text
vite preview
```

## Desarrollo local

Comando actual:

```text
pnpm run dev
```

El script ejecuta:

```text
vite
```

## Despliegue SPA

`vercel.json` contiene una reescritura:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Esto permite que rutas internas como `/admin/pagos` o `/planilla` carguen correctamente al refrescar el navegador.

## Lint

Comando actual:

```text
pnpm run lint
```

El script ejecuta:

```text
eslint .
```

## Riesgos pendientes observados

- El fallback de API apunta a `http://localhost:8000`.
- Las rutas protegidas del frontend dependen de `localStorage`.
- El frontend aun puede contener archivos generados en `dist/` dentro del repo.
- Existen logs locales de Vite en la raiz del proyecto.
- La seguridad efectiva depende de que el backend valide cada endpoint.
