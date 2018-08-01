# Deploy env
1. `# apt update && apt upgrade`
2. `# apt install docker-compose`

# Prod start (also starts on boot)
1. Change last line of `app/Dockerfile` to `CMD yarn prod`
2. `# bash update-restart.sh`

# Dev start
1. Change last line of `app/Dockerfile` to `CMD yarn dev`
2. `# mkdir -p docker-data/redis && chown -R 100:101 docker-data/redis`
3. `$ docker-compose up --abort-on-container-exit`

# Access pgAdmin
1. `$ ssh <server ip> -L 31300:localhost:31300`
2. Ensure server started
3. Open http://localhost:31300/browser/
4. Login (email: admin@example.com, password: password)
5. Create new server (host: postgres, username: postgres, password: password)

# Manual migrate
1. Ensure server started
2. `$ docker exec $(pwd)_node_1 npx knex migrate:latest --knexfile app/knexfile.js`