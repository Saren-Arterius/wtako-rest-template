#!/bin/bash
docker-compose stop
docker-compose rm
git pull
docker-compose build
mkdir -p docker-data/redis && chown -R 100:101 docker-data/redis
docker-compose up -d