# 🎓 Sistema Escolar

Aplicación web completa para la gestión académica de instituciones educativas.

## 🚀 Tecnologías utilizadas

* ⚙️ Backend: FastAPI (Python)
* 🎨 Frontend: React + Vite
* 🗄️ Base de datos: PostgreSQL
* 🔐 Autenticación: JWT con roles (admin / profesor)

---

## 📚 Funcionalidades

### 👨‍🏫 Profesor

* Registro y gestión de notas
* Control de asistencia
* Visualización de estudiantes por curso
* Planilla dinámica tipo Excel

### 🛠️ Administrador

* Gestión de usuarios
* Control total del sistema
* Configuración de módulos

---

## 📊 Características destacadas

* Sistema de roles (seguridad por permisos)
* Planilla de notas dinámica
* Interfaz responsive (móvil y escritorio)
* Validaciones en backend con FastAPI
* Consumo de API con React

---

## ⚙️ Instalación

### 🔧 Backend

```bash
cd sistema_escolar_api
pip install -r requirements.txt
uvicorn main:app --reload
```

---

### 💻 Frontend

```bash
cd frontend-react
# Prefer `pnpm`. Si no lo tienes, habilita Corepack (Node >=16.10) o instala pnpm globalmente:
# Corepack (recomendado):
#   corepack enable && corepack prepare pnpm@latest --activate
# O instala pnpm globalmente:
#   npm install -g pnpm
pnpm install
pnpm run dev
```

### Migrar desde `npm` a `pnpm` (resumen rápido)

1. Instala/activa `pnpm` como en las instrucciones anteriores.
2. Si tienes `package-lock.json` y quieres conservar las versiones resueltas:

```bash
cd frontend-react
pnpm import   # convierte package-lock.json -> pnpm-lock.yaml
pnpm install
```

3. Si no necesitas importar el lockfile, simplemente elimina `node_modules` y `package-lock.json` y ejecuta:

```bash
rm -rf node_modules package-lock.json   # unix/mac
del /s /q node_modules                   # PowerShell/Windows (o use Explorer)
pnpm install
```

4. Prueba la app y el build:

```bash
pnpm run dev
pnpm run build
```

5. Si encuentras errores por hoisting (módulos que estaban disponibles globalmente con npm), añade la dependencia faltante a `package.json` o habilita hoisting temporalmente en `.npmrc`:

```ini
# .npmrc (opcional, para compatibilidad):
shamefully-hoist=true
```

6. Actualiza CI/Docker para usar `pnpm` (`corepack enable` en runners o instalar pnpm) y reemplaza `npm ci`/`npm install` por `pnpm install --frozen-lockfile`.

Nota: `npx` → `pnpm dlx` cuando uses ejecutables temporales.

---

## 🌐 Acceso

* Frontend: http://localhost:5173
* Backend: http://localhost:8000

---

## 🔐 Seguridad

* Autenticación con JWT
* Validación de roles en backend
* Protección contra accesos no autorizados

---

## 📁 Estructura del proyecto

```text
proyecto_escolar/
 ├── frontend-react
 └── sistema_escolar_api
```

---

## 👨‍💻 Autor

**David Rodriguez**

---

## 📌 Estado del proyecto

🚧 En desarrollo activo

---

## 📝 Cambios recientes

### Panel administrativo

* Se actualizó `src/pages/Admin.jsx` para reemplazar la carga simultánea de todos los módulos administrativos por un sidebar.
* Ahora los módulos `Crear profesor`, `Crear curso`, `Crear materia`, `Asignar clases` y `Tipos de pago` solo se montan cuando el usuario selecciona la opción correspondiente.
* Se agregó carga diferida con `React.lazy` y `Suspense`, evitando que todos los componentes se importen y ejecuten al entrar al panel.
* No se modificó la lógica interna de los componentes administrativos existentes; solo cambió la forma en que se muestran desde el panel.
* Se dejó una pantalla inicial ligera que indica que se debe elegir un módulo antes de cargar datos.

### Dashboard del profesor

* Se actualizó `src/pages/DashboardProfesor.jsx` para mostrar el horario asignado por el administrador a cada profesor.
* El horario se construye desde `/asignaciones/lista` filtrando por `profesor_id`, porque `/mis-clases/{profesorId}` solo devuelve materia y curso.
* Se agregaron tarjetas responsive para móvil y tablet, organizadas por día de la semana.
* En escritorio se muestra una grilla semanal de lunes a viernes con materia, curso y hora de cada clase.
* Se agregó formato de hora en 12 horas y ordenamiento por día y hora de inicio.

### Reorganización: Componente "Tipos de Pago" movido a pestaña Cartera

**Fecha**: Mayo 12, 2026

**Cambio**: Se movió el componente `AdministrarTiposPago` de la pestaña "Gestión Académica" a la pestaña "Cartera" como módulo independiente.

#### ¿Qué se hizo?

1. **Movimiento de archivo**
   - Componente movido desde: `src/components/AdministrarTiposPago.jsx`
   - Componente ahora en: `src/components/cartera/AdministrarTiposPago.jsx`

2. **Actualización de rutas y navegación**
   - Ruta agregada en `src/App.jsx`: `/admin/tipos-pagos` → `TiposPagosAdmin`
   - Enlace agregado en `src/components/NavAdmin.jsx` (desktop y mobile): Sección "Cartera" → "Tipos de Pago"

3. **Actualización de imports**
   - `src/pages/Admin.jsx`: Removido import y módulo de `AdministrarTiposPago`
   - `src/pages/GestionAcademica.jsx`: Removido import y componente de `AdministrarTiposPago`
   - `src/pages/TiposPagosAdmin.jsx`: Import actualizado a `../components/cartera/AdministrarTiposPago`

4. **Limpieza**
   - Eliminado archivo duplicado: `src/components/AdministrarTiposPago.jsx`

#### Funcionalidades del componente

El componente `AdministrarTiposPago` gestiona los tipos de pago (conceptos de recaudo) de la institución:

- **Crear**: Agregar nuevos conceptos de pago con nombre y valor
- **Editar**: Modificar conceptos existentes (botón ✏️)
- **Eliminar**: Remover conceptos con confirmación (botón ❌)
- **Listar**: Visualizar todos los conceptos registrados en tarjetas

#### Endpoints API utilizados

```
GET    /tipos-pagos          - Obtener todos los tipos de pago
POST   /tipos-pagos          - Crear nuevo tipo de pago
PUT    /tipos-pagos/{id}     - Actualizar tipo de pago
DELETE /tipos-pagos/{id}     - Eliminar tipo de pago
```

#### Acceso en la aplicación

- **Pestaña**: Cartera (en el menú principal)
- **Ruta**: `/admin/tipos-pagos`
- **Navegación desktop**: Cartera → Tipos de Pago
- **Navegación mobile**: Cartera → Tipos de Pago

#### Documentación del código

Todos los métodos del componente incluyen comentarios explicativos:
- `cargarTiposPagos()`: Carga tipos de pago del backend
- `handleSubmit()`: Crea o actualiza conceptos
- `handleEdit()`: Prepara concepto para edición
- `handleDelete()`: Elimina concepto con confirmación

La interfaz incluye validaciones, alertas de confirmación con SweetAlert2 y respuesta visual inmediata al usuario.
