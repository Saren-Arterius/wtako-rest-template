#!/bin/bash
echo Resetting DB in 3 seconds...
sleep 3
docker-compose down
sudo rm -rf redis/data postgres/data
sudo mkdir -p redis/data && sudo chown -R 999:1000 redis/data
