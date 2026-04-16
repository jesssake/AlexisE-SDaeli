# 📚 Sistema de Gestión Educativa
**Frontend (Angular) + Backend (Node.js, Express, MySQL)**

Proyecto completo para gestión escolar con módulos para maestros, estudiantes, asistencia, calificaciones, tareas, reportes y chat maestro–tutor.

---

## ✝️ Mensaje de fortaleza
**Filipenses 4:13 dice:**  
*"Todo lo puedo en Cristo que me fortalece."*

---

## 🚀 Tecnologías utilizadas

### 🖥️ Frontend
- Angular
- TypeScript
- SCSS
- Angular Material
- Servicios HTTP
- Guards & Routing

### 🔧 Backend
- Node.js / Express
- MySQL
- Multer (subida de archivos y logos)
- PDF-Lib y Docx para exportación
- JWT (autenticación)
- Middlewares dinámicos

---

## 📦 Estructura del proyecto

gestion-educativa/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middlewares/
│   ├── config/dbConfig.js
│   ├── server.js
│   └── app.js
│
└── frontend/
    ├── src/app/features/
    ├── environments/
    └── main.ts

---

## 🖥️ Cómo iniciar el backend

1. Instalar dependencias:

    cd backend  
    npm install

2. Ejecutar:

    node server.js

3. Backend disponible en:

    http://localhost:3000  

Test:

    http://localhost:3000/api/test

---

## 🌐 Cómo iniciar el frontend

1. Instalar dependencias:

    cd frontend  
    npm install

2. Ejecutar Angular:

    ng serve --o

Disponible en:

    http://localhost:4200

---

## 📁 Módulos implementados

✔ Login  
✔ Dashboard maestro  
✔ Estudiantes  
✔ Asistencia  
✔ Tareas  
✔ Materias  
✔ Calificaciones  
✔ Reportes (CSV, Word)  
✔ Chat maestro–tutor  
✔ Configuración  
✔ Subida de logos  
✔ Reportes automáticos  

---

## ⚠️ Errores comunes

### Middlewares no encontrados

Si aparece:

    Cannot find module 'backend/middleware/authMiddleware'

Coloca tus archivos en:

    backend/middlewares/authMiddleware.js  
    backend/middlewares/maestroMiddleware.js

---

## 📄 Exportaciones disponibles

- Reportes CSV  
- Reportes Word  
- Subida de logos  
- Códigos automáticos (REP-000X)

---

## 📧 Autor

Proyecto creado por **Yimpi**.

---

## 📜 Licencia  
Proyecto de uso educativo, libre para adaptar.
"
