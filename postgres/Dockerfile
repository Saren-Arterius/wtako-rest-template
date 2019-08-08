FROM postgres:11-alpine

RUN sh -c 'echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && apk update'
RUN apk add git build-base
RUN git clone https://github.com/fake-name/pg-spgist_hamming.git
RUN cd pg-spgist_hamming/bktree && make && make install

CMD docker-entrypoint.sh postgres -c config_file=/etc/postgresql.conf