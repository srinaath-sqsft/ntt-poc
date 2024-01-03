ARG TAG=latest
FROM docker.elastic.co/sa/unified-ecom-frontend-ecom:${TAG} as copy-src

FROM node:14
RUN apt-get install python -y
WORKDIR /usr/src/frontend-gateway
COPY package*.json ./
COPY prepare_products.py ./
COPY --from=copy-src /usr/src/eas-ecom-demo/products.json ./products-gatsby.json
RUN python prepare_products.py

RUN npm install

COPY . .

EXPOSE 3001

CMD node index.js