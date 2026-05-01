# Deploy con GitHub Actions, GHCR y Portainer

Este proyecto publica dos imágenes Docker en GitHub Container Registry (GHCR):

- `ghcr.io/<owner>/<repo>-backend`
- `ghcr.io/<owner>/<repo>-frontend`

MongoDB no forma parte de este stack. Debe existir por fuera del proyecto, corriendo en Docker y conectado a la red externa `app-network`.

## Requisitos previos

- El repositorio debe estar en GitHub.
- La rama de despliegue debe ser `main`.
- GitHub Actions debe estar habilitado.
- El workflow necesita permisos `Read and write` sobre `Packages` para publicar en GHCR.
- El VPS ya debe tener Docker, Portainer y la red `app-network`.
- El contenedor externo de Mongo debe estar conectado a `app-network`.
- Si el paquete de GHCR es privado, Portainer debe tener credenciales para `ghcr.io`.

## Configuración en GitHub

1. Subí este repositorio a GitHub.
2. Verificá que la rama de despliegue sea `main`.
3. En `Settings > Actions > General`, asegurate de que GitHub Actions esté habilitado.
4. En `Settings > Actions > General > Workflow permissions`, dejá habilitado el uso de `GITHUB_TOKEN`.
5. Hacé push a `main` para disparar el workflow.

No hace falta guardar `DATABASE_MONGO`, `JWT_SECRET` ni variables del stack como secrets de GitHub porque el deploy no ocurre desde GitHub hacia el VPS; GitHub solo construye y publica imágenes.

## Qué hace el workflow

El archivo [deploy.yml](/Users/francosanchez/Documents/www/onDent/.github/workflows/deploy.yml) se ejecuta en cada `push` a `main` y hace lo siguiente:

1. Inicia sesión en `ghcr.io` con `GITHUB_TOKEN`.
2. Construye la imagen del backend desde `server/Dockerfile`.
3. Construye la imagen del frontend desde `front/Dockerfile`.
4. Publica ambas imágenes con dos tags:
   - `latest`
   - sha corto del commit

Ejemplo de tags publicados:

```text
ghcr.io/francocsanchez/ondent-backend:latest
ghcr.io/francocsanchez/ondent-backend:abc1234
ghcr.io/francocsanchez/ondent-frontend:latest
ghcr.io/francocsanchez/ondent-frontend:abc1234
```

## Variables para Portainer

Configurá estas variables en el stack de Portainer. No las guardes con valores reales en el repo.

Variables mínimas:

```env
GHCR_IMAGE_OWNER=
GHCR_IMAGE_REPO=
DATABASE_MONGO=
JWT_SECRET=
FRONTEND_URL=
PORT=
```

Variables recomendadas:

```env
API_PORT=
DEFAULT_USER_PASSWORD=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=
SMTP_FROM_NAME=
SMTP_FROM_EMAIL=
```

Valores típicos:

```env
GHCR_IMAGE_OWNER=francocsanchez
GHCR_IMAGE_REPO=ondent
PORT=4000
API_PORT=4000
FRONTEND_URL=https://tu-dominio.com
DATABASE_MONGO=mongodb://USUARIO:PASSWORD@mongo:27017/onDent?authSource=admin
```

Notas:

- `DATABASE_MONGO` debe usar el hostname `mongo`, no `localhost`, `127.0.0.1` ni la IP pública del VPS.
- `FRONTEND_URL` debe ser la URL pública real del frontend para CORS.
- El frontend usa `/api` en producción y Nginx proxea internamente al backend, por eso no hace falta hardcodear `VITE_API_URL` con un dominio público.

## Uso de compose.prod.yaml

El archivo [compose.prod.yaml](/Users/francosanchez/Documents/www/onDent/compose.prod.yaml) usa imágenes publicadas en GHCR y no hace `build` local.

Servicios incluidos:

- `backend`
- `frontend`

Servicios excluidos:

- `mongo`

La red está declarada como externa:

```yaml
networks:
  app-network:
    external: true
```

## Crear el stack en Portainer

1. Confirmá que `app-network` exista en el VPS.
2. Si GHCR es privado, agregá un registry en Portainer para `ghcr.io` usando un usuario de GitHub y un token con permiso `read:packages`.
3. En Portainer, abrí `Stacks`.
4. Creá un stack nuevo o editá el actual.
5. Pegá el contenido de [compose.prod.yaml](/Users/francosanchez/Documents/www/onDent/compose.prod.yaml).
6. Cargá las variables de entorno del stack.
7. Desplegá el stack.

El frontend expone `80:80`. El backend expone `${API_PORT:-4000}:4000`.

## Actualizar el stack cuando haya nuevas imágenes

Cada `push` a `main` publica nuevas imágenes en GHCR.

Para que Portainer use la última versión:

1. Abrí el stack.
2. Elegí la opción de redeploy o update.
3. Activá `Pull latest image` si Portainer lo ofrece.
4. Redeployá el stack.

También podés hacerlo por CLI en el VPS:

```bash
docker compose -f compose.prod.yaml pull
docker compose -f compose.prod.yaml up -d
```

## Comandos útiles

Verificar workflow localmente antes de pushear:

```bash
git status
git add .github/workflows/deploy.yml compose.prod.yaml front/nginx.conf compose.yaml README_DEPLOY.md
git commit -m "Add GHCR deploy pipeline"
git push origin main
```

Ver imágenes publicadas:

```bash
docker pull ghcr.io/<owner>/<repo>-backend:latest
docker pull ghcr.io/<owner>/<repo>-frontend:latest
```

## Estado actual del proyecto

- El backend usa `process.env.DATABASE_MONGO`.
- El backend no depende de `.env` en producción.
- El backend escucha en `0.0.0.0`.
- El frontend se compila con Vite y se sirve con Nginx.
- Nginx soporta SPA con fallback a `index.html`.
- Mongo queda completamente fuera del compose de producción.
