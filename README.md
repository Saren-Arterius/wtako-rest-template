# Deploy environment
Ensure docker-compose installed:
1. `# apt update && apt upgrade`
2. `# apt install docker-compose`

# Build and start server (also starts on boot)
1. `# ./start.sh`

# Switch to production environment
1. Uncomment line 15, 16 of `docker-compose.yml`

# Access web
1. `$ ssh <server ip> -L 31380:localhost:31380`
2. Ensure docker started
3. Open http://localhost:31380/

# Access pgAdmin
1. `$ ssh <server ip> -L 31300:localhost:31300`
2. Ensure docker started
3. Open http://localhost:31300/browser/
4. Login (email: admin@example.com, password: password)
5. Create new server (host: postgres, username: postgres, password: password)

# Access phpredmin
1. `$ ssh <server ip> -L 31301:localhost:31301`
2. Ensure docker started
3. Open http://localhost:31301
4. Login (email: admin, password: admin)

# Update from git, rebuild docker image if needed, and restart server (also starts on boot)
1. `# ./update-restart.sh`

# Reset & delete data of postgres & redis
1. `# ./reset.sh`

# Change postgres schema without adding migration file & keep existing data (dangerous on production)
1. `# ./revolute-db.sh`