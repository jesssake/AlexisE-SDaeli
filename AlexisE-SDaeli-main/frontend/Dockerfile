# Frontend Dockerfile - Angular con Nginx
# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# Stage 2: Serve con Nginx
FROM nginx:alpine

# Copiar archivos compilados
COPY --from=build /app/dist/gestion-educativa /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
