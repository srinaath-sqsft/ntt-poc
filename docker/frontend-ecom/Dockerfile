#build environment
FROM node:12
MAINTAINER Solution Architects "dalem@elastic.co"


RUN apt-get update && apt-get clean
RUN apt-get install -y --allow-unauthenticated jq && apt-get clean
RUN mkdir /usr/src/eas-ecom-demo
COPY ./yarn.lock /usr/src/eas-ecom-demo/yarn.lock
# COPY ./.npmrc /usr/src/eas-ecom-demo/.npmrc
COPY ./package.json /usr/src/eas-ecom-demo/package.json
WORKDIR /usr/src/eas-ecom-demo
RUN yarn install

COPY . /usr/src/eas-ecom-demo

RUN npm i npm@latest -g
RUN npm install -g gatsby-cli@2.17.1

#RUN curl -sSL https://sdk.cloud.google.com | bash
#ENV PATH $PATH:/root/google-cloud-sdk/bin/
RUN chmod +x /usr/src/eas-ecom-demo/scripts/*.sh
#RUN /usr/src/eas-ecom-demo/scripts/download_images.sh
RUN gatsby build
EXPOSE 9000
CMD [ "/bin/bash", "./scripts/docker-entrypoint.sh" ]
