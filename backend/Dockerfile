# Usar imagen base de Node.js 18
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto 4205
EXPOSE 4205

# Comando para iniciar la aplicación
CMD ["npm", "start"]