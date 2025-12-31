# x0y0 – API Base (Express + TypeScript + Mongoose)

API RESTful construida con **Express**, **TypeScript** y **Mongoose (MongoDB)**.  
Este proyecto es la base de una aplicación escalable, lista para extender con más modelos, controladores y middlewares.

---

## 🚀 Características

- Backend con **Express**.
- Tipado completo con **TypeScript**.
- Conexión a **MongoDB** usando Mongoose.
- Arquitectura basada en controladores.
- Middleware para logging (morgan) y parsing de JSON.
- Scripts separados para desarrollo y producción.

---

## 📂 Estructura del proyecto

```
x0y0_NoSql/
├── server/
│   ├── src/
│   │   ├── index.ts          # Entry point (conexión a DB + server.listen)
│   │   ├── server.ts         # Configuración de Express
│   │   ├── models/           # Modelos de Mongoose (ej: Usuario.ts)
│   │   ├── controllers/      # Controladores de rutas (ej: UsuarioController.ts)
│   │   └── routes/           # Definición de endpoints
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
└── cliente/                  # (frontend en React, aún no implementado)
```

---

## 🛠️ Requisitos previos

- [Node.js](https://nodejs.org/) (v20 o superior recomendado)
- [MongoDB](https://www.mongodb.com/) en local o en la nube (ej. Atlas)
- npm (incluido con Node)

---

## ⚙️ Instalación

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/francocsanchez/x0y0_noSql.git
   cd x0y0_noSql/server
   ```

2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Crear un archivo `.env` en `server/` con tus variables:
   ```env
   PORT=4000
   MONGO_URI=mongodb://localhost:27017/x0y0_db
   NODE_ENV=development
   ```

---

## ▶️ Scripts disponibles

En la carpeta `server/`:

- **Desarrollo (con hot reload):**
  ```bash
  npm run dev
  ```
- **Build (compila a JS en `dist/`):**
  ```bash
  npm run build
  ```
- **Producción (ejecuta el build):**
  ```bash
  npm start
  ```

---

## 📡 Endpoints básicos

- **GET** `/api/usuarios` → listado de usuarios

---

## 🤝 Contribuir

1. Hacé un **fork** del proyecto.
2. Creá una nueva rama (`git checkout -b feature/nueva-feature`).
3. Commit de los cambios con un mensaje claro (`git commit -m "feat: agregar middleware de auth"`).
4. Push a la rama (`git push origin feature/nueva-feature`).
5. Abrí un **Pull Request**.

### Convenciones de commits

Se recomienda usar [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `docs:` cambios en documentación
- `refactor:` cambios de código sin alterar comportamiento
- `test:` cambios o agregados en tests

---

## 📖 Próximos pasos

- Implementar middlewares de validación y autenticación.
- Crear tests automatizados.
- Conectar el frontend (`/cliente`) en React.

---

## 📜 Licencia

MIT © 2025 [Franco Sanchez]
