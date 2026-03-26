# Use official Node.js image with specific version
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package and lock files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Use lightweight Nginx for serving build
FROM nginx:alpine

# Copy build to Nginx serving directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port for Nginx
EXPOSE 80

# Run Nginx
CMD ["nginx", "-g", "daemon off;"]
