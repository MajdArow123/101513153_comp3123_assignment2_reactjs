# Frontend image, built in two stages:
#   1. "build": Node installs the dependencies and runs `vite build` -> static files in dist/
#   2. nginx serves those static files. Node and node_modules are not in the final image,
#      which keeps it small.

# ---------- Stage 1: build the React app ----------
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite puts VITE_* variables into the JavaScript bundle at BUILD time (not at run time),
# so the backend URL is passed in as a build argument by docker-compose.yml.
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---------- Stage 2: serve it with nginx ----------
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
# The nginx image already starts nginx in the foreground by default.
