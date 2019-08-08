#!/bin/bash
sudo mkdir -p redis/data && sudo chown -R 999:1000 redis/data
docker-compose up -d
docker-compose logs --tail=1000 -f app
