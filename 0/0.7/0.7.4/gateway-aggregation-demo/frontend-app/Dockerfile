# Usa una imagen base de Nginx
FROM nginx:alpine

# Copia los archivos estáticos del frontend al directorio web de Nginx
COPY index.html /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/

# Expone el puerto 80 (puerto por defecto de Nginx)
EXPOSE 80