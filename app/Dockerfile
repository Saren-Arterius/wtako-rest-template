FROM node:12-alpine

RUN npm config set unsafe-perm true
RUN npm install -g nodemon

RUN mkdir /src
WORKDIR /src

RUN sh -c 'echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && apk update'

ADD package.json /src/package.json
ADD package-lock.json /src/package-lock.json
RUN npm install

CMD npm run dev