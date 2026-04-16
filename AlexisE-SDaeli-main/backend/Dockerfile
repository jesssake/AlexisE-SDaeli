# Backend Dockerfile - Node.js
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto de los archivos
COPY . .

# Crear directorio para uploads si no existe
RUN mkdir -p uploads/logos uploads/tareas

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
