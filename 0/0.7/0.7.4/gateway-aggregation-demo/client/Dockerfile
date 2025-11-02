FROM node:18-alpine

WORKDIR /app

COPY package.json tsconfig.json vite.config.ts ./
RUN npm install

COPY src ./src
COPY index.html .

EXPOSE 3001

CMD ["npm", "run", "dev"]