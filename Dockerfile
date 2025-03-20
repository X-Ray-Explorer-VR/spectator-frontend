FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Next.js variables
ENV PORT=80
ENV HOSTNAME="0.0.0.0"

# App routes variables
ENV API_BASE_URL="http://localhost:5000"
ENV WEBSOCKET_URL="ws://localhost:8080"

RUN npm run build

EXPOSE ${PORT}

CMD ["npm", "start"]
