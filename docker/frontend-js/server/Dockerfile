FROM node:14

WORKDIR /usr/src/frontend-gateway

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD node index.js