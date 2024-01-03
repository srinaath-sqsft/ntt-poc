FROM node:14

WORKDIR /usr/src/rum-demo

COPY package.json yarn.lock ./

RUN npm install --prod

COPY . .

EXPOSE 3000

# Use this to connect to the frontend gateway
ENV API_ENDPOINT="http://localhost:3001"

CMD npm run build && npm run start