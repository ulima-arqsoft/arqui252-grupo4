#  DOCKERFILE INSEGURO - SOLO PARA DEMOSTRACIÓN 
# Este Dockerfile contiene múltiples vulnerabilidades intencionales

# PROBLEMA 1: Imagen base pesada y con vulnerabilidades
FROM ubuntu:latest

# PROBLEMA 2: Ejecutar como root (sin especificar USER)
# PROBLEMA 3: Instalar paquetes innecesarios
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    vim \
    sudo \
    nodejs \
    npm

# PROBLEMA 4: No limpiar cache de apt
# PROBLEMA 5: Copiar TODO el proyecto (incluyendo node_modules, .git, etc)
COPY . /app

WORKDIR /app

# PROBLEMA 6: npm install sin --production
# PROBLEMA 7: No usar npm ci
RUN npm install

# PROBLEMA 8: Exponer puerto sin documentar
EXPOSE 3000

# PROBLEMA 9: Credenciales hardcodeadas en variables de entorno
ENV DB_PASSWORD=admin123
ENV JWT_SECRET=secretkey
ENV NODE_ENV=production

# PROBLEMA 10: Ejecutar como root
CMD ["node", "src/server.js"]

# RESUMEN DE PROBLEMAS:
# - Imagen base pesada (Ubuntu > 70MB vs Alpine < 10MB)
# - Ejecuta como root (UID 0)
# - Paquetes innecesarios instalados
# - No se limpian archivos temporales
# - Credenciales en texto plano
# - No hay health checks
# - No hay límites de recursos
# - Copia archivos innecesarios (.git, node_modules, etc)