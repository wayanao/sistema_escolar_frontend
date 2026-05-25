# API Client

Estado actual del consumo de API desde el frontend.

## Cliente Axios principal

El cliente compartido esta en:

- `src/utils/api.js`

Configuracion actual:

- `baseURL`: `import.meta.env.VITE_API_URL || "http://localhost:8000"`.
- `withCredentials: true`.
- Header por defecto: `Content-Type: application/json`.

## Token

El interceptor de request busca token en este orden:

1. Cookie `token`, usando `js-cookie`.
2. `localStorage.usuario.access_token`.
3. `localStorage.profesor.access_token`.

Si encuentra token, agrega:

```text
Authorization: Bearer <token>
```

## Tenant

El interceptor lee:

- `localStorage.tenant`

Si existe, agrega:

```text
X-Tenant-ID: <tenant>
```

## Manejo de 401

El interceptor de response hace limpieza cuando recibe `401` y la ruta actual no es `/login`:

- Elimina cookie `token`.
- Elimina `localStorage.usuario`.
- Elimina `localStorage.profesor`.
- Elimina `localStorage.tenant`.
- Redirige a `/login`.

## Login

`LoginForm.jsx` consume:

```text
POST /login
```

Envia:

- `email`
- `password`
- `codigo_colegio`

## Imagenes protegidas

`ImagenProtegida.jsx` usa el cliente `api` con:

```text
responseType: "blob"
```

Esto permite cargar imagenes que requieren credenciales/autorizacion.

## Servicio de impresion

`src/services/printingService.js` usa `api` para endpoints de:

- Branding.
- Logos.
- Plantillas.
- Activacion, duplicacion, actualizacion y eliminacion de plantillas.

Endpoints observados en ese servicio:

- `GET /branding`
- `PUT /branding`
- `POST /branding/logo`
- `DELETE /branding/logo`
- `GET /plantillas`
- `GET /plantillas/activa/{tipo}`
- `POST /plantillas/{plantillaId}/activar`
- `POST /plantillas/{plantillaId}/duplicar`
- `PUT /plantillas/{plantillaId}`
- `DELETE /plantillas/{plantillaId}`
- `POST /plantillas`

## Riesgos pendientes observados

- El frontend conserva fallback de token desde `localStorage`.
- `VITE_API_URL` cae a `http://localhost:8000` si no esta configurado.
- La autorizacion final debe estar siempre en backend, no solo en la UI.
