# Dockerfile

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the project files
COPY . .

# Build TypeScript files
RUN npm run build

# Expose the port your app listens on
EXPOSE 4002

# Start the app using the compiled JavaScript
# CMD ["node", "dist/server.js"]  
CMD ["npm", "run","dev"]