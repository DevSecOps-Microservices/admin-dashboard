# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

ENV NODE_OPTIONS=--openssl-legacy-provider
ENV CI=false

COPY package.json ./
RUN npm install --legacy-peer-deps && \
    npm install ajv@8 ajv-keywords@5 --legacy-peer-deps

COPY . .

ARG REACT_APP_API_URL=http://localhost:8880
ARG REACT_APP_KEYCLOAK_URL=http://localhost:8080
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_KEYCLOAK_URL=$REACT_APP_KEYCLOAK_URL

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 4200
CMD ["nginx", "-g", "daemon off;"]
