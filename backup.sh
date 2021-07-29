#!/bin/bash
SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
cd $SCRIPTPATH

set -x

filename=pg_backup
dbname="app_backend_dev"

rm -f pgadmin/data/storage/admin_example.com/${filename}
docker-compose exec -T pgadmin sh -c "PGPASSWORD='pg_password' /usr/local/pgsql-13/pg_dump --file '/var/lib/pgadmin/storage/admin_example.com/${filename}' --host 'postgres' --port '5432' --username 'postgres' --verbose --format=c --blobs --data-only --schema 'public' --dbname '${dbname}' --data-only"
tar_filename=${HOME}/app_backup_`hostname`.tar.gz

sudo tar -acvf ${tar_filename} pgadmin/data/storage/admin_example.com/${filename} redis/data/dump.rdb
# curl --verbose --progress-bar -F document=@"${tar_filename}" 'https://api.telegram.org/botXXX:YYY/sendDocument?chat_id=ZZZ'