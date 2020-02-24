#!/bin/bash
# Change the schema without adding migration & keep existing data
SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
cd $SCRIPTPATH

set -x

filename=dev_$(date '+%Y-%m-%d_%H-%M-%S')
if [[ -z "${PROD}" ]]; then
  dbname="app_backend_dev"
else
  dbname="app_backend_prod"
fi

echo ${filename}
docker-compose exec pgadmin sh -c "PGPASSWORD='password' /usr/local/pgsql-12/pg_dump --file '/var/lib/pgadmin/storage/admin_example.com/${filename}' --host 'postgres' --port '5432' --username 'postgres' --verbose --format=c --blobs --data-only --schema 'public' --dbname '${dbname}' --data-only" &&
docker-compose exec app sh -c 'cd app/dist; node bin/revolute-db.js' &&
docker-compose exec pgadmin sh -c "PGPASSWORD='password' /usr/local/pgsql-12/pg_restore --host 'postgres' --port '5432' --username 'postgres' --no-password --dbname '${dbname}' --data-only --single-transaction --verbose --schema 'public' '/var/lib/pgadmin/storage/admin_example.com/${filename}'"
