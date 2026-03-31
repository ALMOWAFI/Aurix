# Stage 1: Build the React application
FROM node:20-slim AS build

WORKDIR /app

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend code and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve the built files with Nginx
FROM nginx:alpine

# Copy the built files from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy a custom Nginx configuration if needed (I'll create this next)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
