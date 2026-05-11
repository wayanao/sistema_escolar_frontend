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
npm install
npm run dev
```

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
