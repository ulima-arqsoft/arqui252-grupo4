# docker/Dockerfile (VULNERABLE)
# Usando una imagen base grande (Ubuntu-based) y ejecutando como root
FROM node:18 

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
# CMD se ejecuta por defecto como root
CMD [ "node", "src/server.js" ]