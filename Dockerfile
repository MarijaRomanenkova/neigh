FROM node:20.11.1-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY socket/package*.json ./socket/

# Install dependencies for both services
RUN npm install
RUN cd socket && npm install

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Expose ports for Next.js and Socket.IO
EXPOSE 3000
EXPOSE 3001

# Start both services
CMD ["sh", "-c", "cd socket && node socket-server.js & npm start"] 
