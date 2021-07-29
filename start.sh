#!/bin/bash
# Spin up dev server
SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
cd $SCRIPTPATH

sudo docker-compose up -d
uidgid=`docker-compose exec redis sh -c 'cat /etc/passwd | grep redis | grep -oE [0-9]{1,}:[0-9]{1,}'`
uidgid=`echo $uidgid | tr '\r' ' '`
echo $uidgid
sudo mkdir -p redis/data && sudo chown -R $uidgid redis/data
docker-compose logs --tail=100 -f app
