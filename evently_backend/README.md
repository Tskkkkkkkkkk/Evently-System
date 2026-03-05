# Evently Backend (Django + MongoDB)

## 1. Start MongoDB

In a terminal, run:

```bash
cd evently_backend
mkdir -p mongo_data
mongod --dbpath mongo_data --bind_ip localhost --port 27017
```

Leave this running. You should see `Waiting for connections`.

If you get "Permission denied" on a socket file, run once: `sudo rm -f /tmp/mongodb-27017.sock` then start mongod again.

## 2. Run Django

In another terminal:

```bash
cd evently_backend
pip install -r requirements.txt   # if needed
python manage.py migrate         # if needed (for Django auth)
python manage.py runserver
```

Backend will be at **http://localhost:8000**. API base: **http://localhost:8000/api**.

## 3. Run Frontend

```bash
cd evently_frontend
npm install
npm start
```

Frontend runs at **http://localhost:3000** and talks to the API at port 8000.

## What uses MongoDB

- **User profiles** (phone, user_type) – saved when you sign up
- **Venues** – list, detail, add/edit/delete from Dashboard

If MongoDB is not running: login and signup still work (Django database). Venues list will be empty; adding venues will show an error until MongoDB is started.
