FROM node:16-alpine3.13

RUN npm config set unsafe-perm true
RUN npm install -g nodemon

RUN mkdir /src
WORKDIR /src

# RUN sh -c 'echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && apk update'
# RUN sh -c 'apk update'
# RUN apk add mediainfo graphicsmagick ffmpeg libheif-dev imagemagick

ADD package.json /src/package.json
ADD package-lock.json /src/package-lock.json
ADD .babelrc /src/.babelrc

RUN npm install --legacy-peer-deps
# If 'sharp' is needed
# RUN npm install sharp@^0.23.4

CMD npm run dev