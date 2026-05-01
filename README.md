# OnDent

Aplicación full stack con frontend en React/Vite, backend en Express/TypeScript y base de datos MongoDB.

## Estructura

```text
.
├── front/    # SPA React + Vite
├── server/   # API Express + TypeScript
└── docker-compose.yml
```

## Docker

El proyecto usa Docker Compose con dos servicios:

- `frontend`: compila la SPA y la sirve con Nginx.
- `backend`: compila el backend TypeScript y lo ejecuta con Node.

El frontend usa proxy de Nginx hacia `/api`, así que no depende de una URL interna del contenedor para hablar con el backend.
MongoDB debe existir por fuera de este stack y compartir la red Docker `ondent-network`.

## Levantar el stack

1. Asegurar que exista la red externa:

```bash
docker network create ondent-network
```

2. Definir las variables de entorno del backend.

Variables mínimas del backend:

```env
DATABASE_MONGO=
JWT_SECRET=
PORT=
FRONTEND_URL=
```

Variables opcionales:

```env
DEFAULT_USER_PASSWORD=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=
SMTP_FROM_NAME=
SMTP_FROM_EMAIL=
```

3. Construir y levantar:

```bash
docker compose up -d --build
```

4. Acceder a la app:

- Frontend: `http://localhost`
- Backend: `http://localhost:4000`
- Healthcheck backend: `http://localhost:4000/api/health`

## Variables de entorno

No guardes valores reales sensibles en el repositorio.

Ejemplo de variables:

```env
DATABASE_MONGO=
PORT=4000
JWT_SECRET=
FRONTEND_URL=
DEFAULT_USER_PASSWORD=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
SMTP_FROM_NAME=
SMTP_FROM_EMAIL=
```

Notas:

- `DATABASE_MONGO` debe apuntar al contenedor externo `mongo-ondent` dentro de `ondent-network`, usando autenticación y la base `ondent`.
- `FRONTEND_URL` controla CORS cuando el backend recibe requests con `Origin`.
- `SMTP_*` solo es necesario si vas a usar recuperación de contraseña por email.
- El frontend usa `/api` en producción y Nginx redirige internamente al backend.

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

En local podés seguir usando `.env` dentro de `server/`; el backend solo carga `dotenv` fuera de producción.

## Deploy manual

La guía completa para VPS Ubuntu está en [DEPLOY_VPS.md](/Users/francosanchez/Documents/www/onDent/DEPLOY_VPS.md).
