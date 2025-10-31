# 1) Build
FROM node:18-alpine AS build
WORKDIR /usr/src/app
COPY package.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build

# 2) Runtime
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --production
COPY --from=build /usr/src/app/dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
