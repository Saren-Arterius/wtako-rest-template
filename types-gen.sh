#!/bin/bash
SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
cd $SCRIPTPATH

docker-compose exec app node app/dist/bin/types-gen.js
sudo chown $(whoami) app/src/types/tables.js
cat app/src/types/tables.js | tr '\n' '\r' | sed -e 's/export enum Table {[^}]*}//g' |  tr '\r' '\n' > app/src/types/tables.js.temp
mv -f app/src/types/tables.js.temp app/src/types/tables.js
