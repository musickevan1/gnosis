# Use Node.js as the base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Expose the port the app runs on
EXPOSE 5177

# Start the app
ENV VITE_HOST=0.0.0.0
ENV VITE_PORT=5177
CMD ["npm", "run", "dev"]
