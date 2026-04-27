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
