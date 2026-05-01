# Deploy manual en VPS Ubuntu

Esta guía deja MongoDB separado del proyecto y levanta OnDent con Docker Compose usando dos contenedores:

- `backend`
- `frontend`

MongoDB no forma parte del `docker-compose.yml` del proyecto.

## 1. Instalar Docker y Docker Compose en Ubuntu

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

Cerrá sesión y volvé a entrar para usar Docker sin `sudo`.

## 2. Crear la red compartida

```bash
docker network create ondent-network
```

Si ya existe, Docker lo va a informar y no hace falta recrearla.

## 3. Levantar MongoDB como contenedor independiente

```bash
docker volume create mongo_ondent_data
docker run -d \
  --name mongo-ondent \
  --restart unless-stopped \
  -p 27017:27017 \
  --network ondent-network \
  -v mongo_ondent_data:/data/db \
  -e MONGO_INITDB_ROOT_USERNAME=usuario \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:7
```

## 4. Variable DATABASE_MONGO

El backend debe conectarse usando el nombre del contenedor Mongo dentro de la red Docker:

```env
DATABASE_MONGO=mongodb://usuario:password@mongo-ondent:27017/ondent?authSource=admin
```

No uses `localhost`, `127.0.0.1` ni una IP pública para conectar el backend con Mongo.

## 5. Clonar el proyecto y configurar variables

```bash
git clone <URL_DEL_REPOSITORIO>
cd onDent
```

Creá tu archivo `.env` local en la raíz si querés que `docker compose` tome variables automáticamente.
No subas ese archivo al repositorio.

Variables mínimas:

```env
DATABASE_MONGO=
PORT=4000
JWT_SECRET=
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

## 6. Levantar el proyecto

```bash
docker compose up -d --build
```

## 7. Actualizar manualmente después de un git pull

```bash
git pull
docker compose down
docker compose up -d --build
```

## 8. Reconstruir frontend y backend sin tocar Mongo

Mongo está fuera del compose del proyecto, así que este comando no lo toca:

```bash
docker compose up -d --build
```

Si querés reconstruir un servicio puntual:

```bash
docker compose up -d --build backend
docker compose up -d --build frontend
```

## 9. Logs útiles

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

## 10. Reinicio de servicios

```bash
docker compose restart backend
docker compose restart frontend
```

## 11. Limpiar imágenes viejas

```bash
docker image prune -f
```

## Arquitectura final

```text
VPS Ubuntu
│
├── Docker
│
├── MongoDB independiente
│   └── mongo-ondent
│
└── Proyecto OnDent
    ├── frontend
    └── backend
        └── conecta a Mongo usando DATABASE_MONGO
```
