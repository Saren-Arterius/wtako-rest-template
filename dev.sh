#!/bin/bash
docker-compose up -d
docker-compose logs --tail=1000 -f app
