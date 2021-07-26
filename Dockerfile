FROM node:lts
RUN mkdir /workspace
WORKDIR /workspace

COPY . .

RUN npm i