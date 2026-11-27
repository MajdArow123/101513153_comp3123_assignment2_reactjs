# Backend image: the Express API.
# Small official Node image (Alpine Linux).
FROM node:22-alpine

WORKDIR /app

# Copy only the package files first and install. Docker caches this layer, so the
# dependencies are only reinstalled when package.json / package-lock.json change.
# --omit=dev: nodemon etc. are not needed in the container.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Then copy the source code (.dockerignore keeps out node_modules, .env, logs, uploads).
COPY . .
# COPY keeps each file's permissions from the computer it was built on. Make the app's
# own files readable by everyone (a+r, plus X for folders), so the "node" user below can
# run them, but leave them owned by root, so the app can't change its own code.
RUN chmod -R a+rX package.json server.js src

# Folders the app writes to. They belong to the unprivileged "node" user, because the
# app does not run as root (a compromised app can do less damage).
RUN mkdir -p uploads logs && chown node:node uploads logs
USER node

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
