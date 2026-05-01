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

El proyecto queda dockerizado con dos servicios:

- `front`: compila la SPA y la sirve con Nginx.
- `server`: compila el backend TypeScript y lo ejecuta con Node.

El frontend usa proxy de Nginx hacia `/api`, así que no depende de una URL interna del contenedor para hablar con el backend.
MongoDB debe existir por fuera de este stack y compartir la red Docker `app-network`.

## Levantar el stack

1. Asegurar que exista la red externa:

```bash
docker network ls
```

2. Cargar variables desde Portainer o exportarlas en la shell.

Variables mínimas del backend:

```env
DATABASE_MONGO=
JWT_SECRET=
FRONTEND_URL=
PORT=
```

Variables opcionales:

```env
DEFAULT_USER_PASSWORD=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=
SMTP_FROM_EMAIL=
SMTP_SECURE=
API_PORT=
FRONT_PORT=
VITE_API_URL=
```

3. Construir y levantar:

```bash
docker compose up -d --build
```

4. Acceder a la app:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:4000`
- Healthcheck backend: `http://localhost:4000/api/health`

## Variables de entorno

No se deben guardar valores reales en archivos `.env` para producción si vas a inyectarlos desde Portainer.

Ejemplo de variables:

```env
API_PORT=4000
FRONT_PORT=8080
DATABASE_MONGO=
FRONTEND_URL=
VITE_API_URL=/api
JWT_SECRET=
DEFAULT_USER_PASSWORD=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=
SMTP_FROM_EMAIL=
SMTP_SECURE=false
```

Notas:

- `DATABASE_MONGO` debe apuntar al contenedor externo `mongo` dentro de `app-network`, usando autenticación y la base `onDent`.
- `FRONTEND_URL` controla CORS cuando el backend recibe requests con `Origin`.
- `SMTP_*` solo es necesario si vas a usar recuperación de contraseña por email.
- `VITE_API_URL=/api` es la opción recomendada en producción porque el frontend usa Nginx como proxy al backend.

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
