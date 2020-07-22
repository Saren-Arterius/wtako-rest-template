FROM node:14-alpine

RUN npm config set unsafe-perm true
RUN npm install -g nodemon

RUN mkdir /src
WORKDIR /src

RUN sh -c 'echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && apk update'

ADD package.json /src/package.json
ADD package-lock.json /src/package-lock.json
RUN npm install
# If 'sharp' is needed
# RUN npm install sharp@^0.23.4

CMD npm run dev