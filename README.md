# Deploy env
Ensure docker-compose installed:
1. `# apt update && apt upgrade`
2. `# apt install docker-compose`

# Reset postgres & redis
1. `# ./reset.sh`

# Dev start (also starts on boot)
1. `$ ./dev.sh`

# Prod start (also starts on boot)
1. Change last line of `app/Dockerfile` to `CMD yarn prod`
2. `# bash update-restart.sh`

# Access pgAdmin
1. `$ ssh <server ip> -L 31300:localhost:31300`
2. Ensure server started
3. Open http://localhost:31300/browser/
4. Login (email: admin@example.com, password: password)
5. Create new server (host: postgres, username: postgres, password: password)
