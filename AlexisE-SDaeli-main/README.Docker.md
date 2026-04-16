# 🐳 Docker Setup - Sistema de Gestión Educativa

## 📦 Contenedores

Este proyecto usa Docker Compose con 3 contenedores:

1. **MySQL 8** - Base de datos (Puerto 3306)
2. **Backend Node.js** - API REST con Express (Puerto 3000)
3. **Frontend Angular** - Aplicación web con Nginx (Puerto 4200)

---

## 🚀 Inicio Rápido

### 1. Construir e iniciar todos los contenedores

```bash
docker-compose up -d --build
```

### 2. Ver logs de los contenedores

```bash
# Todos los contenedores
docker-compose logs -f

# Solo un contenedor específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### 3. Verificar estado de los contenedores

```bash
docker-compose ps
```

### 4. Acceder a las aplicaciones

- **Frontend:** http://localhost:8091
- **Backend API:** Interno (solo accesible desde contenedores)
- **MySQL:** Interno (solo accesible desde contenedores)

---

## 🌐 Configuración de Redes

Este proyecto utiliza **dos redes Docker**:

### 🔒 **Red Interna Privada** (`gestion_educativa_internal`)
- **Tipo:** Bridge con `internal: true`
- **Subnet:** 172.28.0.0/16
- **Gateway:** 172.28.0.1
- **Contenedores:** MySQL, Backend, Frontend
- **Características:**
  - ✅ Sin acceso a internet desde los contenedores internos
  - ✅ Solo comunicación entre contenedores del proyecto
  - ✅ MySQL y Backend **NO exponen puertos** al host
  - ✅ Máxima seguridad y aislamiento

### 🌍 **Red Externa** (`npm_network`)
- **Tipo:** Red externa compartida
- **Contenedor conectado:** Frontend (únicamente)
- **Propósito:** Integración con Nginx Proxy Manager
- **Características:**
  - ✅ Permite acceso público al frontend
  - ✅ Compatible con proxy reverso
  - ✅ Soporte para dominios personalizados

### 📊 **Diagrama de Red:**

```
Internet
    ↓
[Nginx Proxy Manager] (npm_network)
    ↓
[Frontend:80] ← Puerto 8091 expuesto
    ↓ (gestion_educativa_internal)
[Backend:3000] → [MySQL:3306]
```

### 🔐 **Ventajas de esta Arquitectura:**

✅ **Seguridad por Capas** - Backend y DB aislados completamente  
✅ **Sin Puertos Expuestos** - MySQL y Backend no accesibles desde el host  
✅ **Comunicación Interna** - Contenedores solo hablan entre sí  
✅ **Integración NPM** - Frontend accesible por Nginx Proxy Manager  
✅ **Múltiples Dominios** - Puedes configurar varios dominios en NPM

---

## 🛠️ Comandos útiles

### Detener contenedores

```bash
docker-compose down
```

### Detener y eliminar volúmenes (⚠️ borra datos)

```bash
docker-compose down -v
```

### Reiniciar un contenedor específico

```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart mysql
```

### Reconstruir un contenedor

```bash
docker-compose up -d --build backend
```

### Ejecutar comandos dentro de un contenedor

```bash
# Backend
docker-compose exec backend sh
docker-compose exec backend npm install

# MySQL
docker-compose exec mysql mysql -u root -p gestion_educativa

# Frontend
docker-compose exec frontend sh
```

### Ver logs en tiempo real

```bash
docker-compose logs -f --tail=100
```

---

## 📊 Estructura de volúmenes

- `mysql_data:/var/lib/mysql` - Datos persistentes de MySQL
- `./backend/uploads:/app/uploads` - Archivos subidos (tareas, logos)

---

## 🔧 Configuración

### Variables de entorno

Puedes modificar las variables en el archivo `docker-compose.yml` o crear un archivo `.env`:

```env
MYSQL_ROOT_PASSWORD=tu_password
MYSQL_DATABASE=gestion_educativa
DB_HOST=mysql
PORT=3000
JWT_SECRET=tu_secret_seguro
```

### Importar base de datos inicial

La base de datos se importa automáticamente al iniciar el contenedor desde:
```
./backend/Base de datos/Dump20251216.sql
```

---

## 🐛 Solución de problemas

### El backend no se conecta a MySQL

```bash
# Verificar que MySQL esté corriendo
docker-compose ps mysql

# Ver logs de MySQL
docker-compose logs mysql

# Esperar a que MySQL termine de inicializar
docker-compose logs -f mysql | grep "ready for connections"
```

### Reiniciar desde cero

```bash
# Detener y eliminar todo
docker-compose down -v

# Reconstruir e iniciar
docker-compose up -d --build
```

### Conectarse a MySQL desde la terminal

```bash
docker-compose exec mysql mysql -u root -p
# Password: 2025Elianadavid
```

### Ver uso de recursos

```bash
docker stats
```

---

## 📝 Notas importantes

- El frontend se construye en modo **producción** optimizado
- La base de datos persiste en un volumen Docker
- Los uploads del backend se mapean a la carpeta local
- El backend espera 10 segundos antes de iniciar para que MySQL esté listo
- Nginx hace proxy de `/api/*` hacia el backend

---

## 🔒 Seguridad

⚠️ **Para producción:**

1. Cambiar passwords por defecto
2. Usar secretos seguros para JWT
3. Configurar variables de entorno con `.env`
4. Habilitar SSL/TLS
5. Configurar firewall y restricciones de red
6. Usar usuario no root en MySQL

---

## 📚 Más información

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MySQL Docker Hub](https://hub.docker.com/_/mysql)
- [Node.js Docker Hub](https://hub.docker.com/_/node)
- [Nginx Docker Hub](https://hub.docker.com/_/nginx)
