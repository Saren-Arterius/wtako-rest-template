#!/bin/bash
echo Resetting DB in 3 seconds...
sleep 3
docker-compose down
sudo rm -r docker-data/postgres docker-data/redis
sudo mkdir -p docker-data/redis && sudo chown -R 100:101 docker-data/redis
docker-compose up -d
docker-compose logs --tail=1000 -f node
