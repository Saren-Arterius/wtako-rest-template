#!/bin/bash
SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
cd $SCRIPTPATH

echo Resetting DB in 3 seconds...
sleep 3
docker-compose down
sudo rm -rf redis/data postgres/data