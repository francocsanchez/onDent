# OnDent

Aplicación full stack con frontend en React/Vite, backend en Express/TypeScript y base de datos MongoDB.

## Estructura

```text
.
├── front/    # SPA React + Vite
├── server/   # API Express + TypeScript
└── compose.yaml
```

## Docker

El proyecto quedó dockerizado completo con tres servicios:

- `front`: compila la SPA y la sirve con Nginx.
- `server`: compila el backend TypeScript y lo ejecuta con Node.
- `mongo`: levanta MongoDB con volumen persistente.

El frontend usa proxy de Nginx hacia `/api`, así que no depende de una URL interna del contenedor para hablar con el backend.

## Levantar el stack

1. Crear el archivo de entorno a partir del ejemplo:

```bash
cp .env.example .env
```

2. Construir y levantar todo:

```bash
docker compose up --build
```

3. Acceder a la app:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:4000`
- Healthcheck backend: `http://localhost:4000/api/health`

## Variables de entorno

El archivo raíz `.env` es usado por Docker Compose.

Variables principales:

```env
API_PORT=4000
FRONT_PORT=8080
MONGO_DATA_DIR=./.docker/mongo
DATABASE_MONGO=mongodb://mongo:27017/ondent
FRONTEND_URL=http://localhost:8080
VITE_API_URL=/api
JWT_SECRET=change-this-jwt-secret
DEFAULT_USER_PASSWORD=Temp1234!
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
SMTP_FROM=OnDent <no-reply@localhost>
```

Notas:

- `DATABASE_MONGO` ya viene preparada para que el backend use el contenedor `mongo`.
- `FRONTEND_URL` controla CORS cuando el backend recibe requests con `Origin`.
- `SMTP_*` solo es necesario si vas a usar recuperación de contraseña por email.
- `MONGO_DATA_DIR` define la carpeta local donde Docker guarda los datos de MongoDB.
- MongoDB no publica puerto al host por defecto; el backend lo consume por red interna de Docker.

## Desarrollo local sin Docker

Frontend:

```bash
cd front
npm install
npm run dev
```

Backend:

```bash
cd server
npm install
npm run dev
```

En ese modo vas a necesitar definir las variables de entorno del backend y `VITE_API_URL` para el frontend.
