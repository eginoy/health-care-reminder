FROM node:lts
RUN mkdir /workspace
WORKDIR /workspace

RUN npm i