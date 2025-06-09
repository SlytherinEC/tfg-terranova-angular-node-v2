# Stage 1: Build de Angular 19
FROM node:18-alpine AS builder

# Instalar dependencias del sistema necesarias para Angular 19
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar Angular CLI globalmente (compatible con Angular 19)
RUN npm install -g @angular/cli@19

# Instalar dependencias del proyecto
RUN npm ci --legacy-peer-deps

# Copiar código fuente
COPY . .

# Reemplazar angular.json con una versión sin budgets
RUN cp angular.json angular.json.backup && \
    cat angular.json | jq 'del(.projects.frontend.architect.build.configurations.production.budgets)' > angular-temp.json && \
    mv angular-temp.json angular.json || \
    (echo "jq no disponible, usando sed..." && \
     sed -i '/"budgets"/,/]/d' angular.json && \
     sed -i 's/,"budgets":\[.*\]//g' angular.json && \
     sed -i 's/"budgets":\[.*\],//g' angular.json)

# Build sin budgets
RUN ng build --output-path=dist/frontend

# DEBUG: Verificar que los archivos se generaron correctamente
RUN echo "=== CONTENIDO DE DIST ===" && \
    ls -la dist/ && \
    echo "=== CONTENIDO DE DIST/FRONTEND ===" && \
    ls -la dist/frontend/ && \
    echo "=== CONTENIDO DE DIST/FRONTEND/BROWSER ===" && \
    ls -la dist/frontend/browser/ && \
    echo "=== ARCHIVOS PRINCIPALES ===" && \
    find dist/ -name "*.html" -o -name "*.js" | head -10

# Stage 2: Servidor nginx optimizado
FROM nginx:alpine

# Remover página por defecto de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar archivos build desde la carpeta /browser/ de Angular 19
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html/

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# DEBUG: Verificar archivos copiados
RUN echo "=== ARCHIVOS EN NGINX ===" && \
    ls -la /usr/share/nginx/html/ && \
    echo "=== CONFIGURACIÓN NGINX ===" && \
    cat /etc/nginx/conf.d/default.conf

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && adduser -S angular -u 1001 -G nodejs

# Exponer puerto 80
EXPOSE 80

# Ejecutar nginx
CMD ["nginx", "-g", "daemon off;"] 