#!/bin/bash
docker-compose down
git pull
docker-compose build
sudo mkdir -p docker-data/redis && sudo chown -R 100:101 docker-data/redis
docker-compose up -d
