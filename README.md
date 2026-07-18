# ATLAS — Backend

API REST del sistema de almacén ATLAS. Node.js + Express + MySQL, organizada
en capas: `routes` → `controllers` → `services` → base de datos.

## Estructura

```
backend/
├── src/
│   ├── config/db.js          # Pool de conexión a MySQL
│   ├── middlewares/          # auth (JWT), roles, manejo de errores
│   ├── routes/                # Define los endpoints y sus permisos
│   ├── controllers/           # Reciben la petición, llaman al service, responden
│   ├── services/              # Lógica de negocio y consultas SQL
│   ├── utils/                 # ApiError, asyncHandler
│   ├── app.js                  # Configuración de Express
│   └── server.js               # Punto de entrada
├── sql/schema.sql             # Esquema de la base de datos
├── scripts/seed.js            # Crea el primer usuario administrador
└── .env.example
```

## 1. Instalación

```bash
cd backend
npm install
cp .env.example .env
```

Edita `.env` con tus datos reales de MySQL y un `JWT_SECRET` largo y aleatorio
(puedes generar uno con `openssl rand -hex 32`).

## 2. Base de datos

Con tu servidor MySQL corriendo:

```bash
mysql -u root -p < sql/schema.sql
```

Esto crea la base `atlas_almacen` con las tablas `usuarios`, `productos` y
`movimientos`.

Después, crea el primer usuario administrador:

```bash
npm run seed
```

Esto imprime en consola el usuario y contraseña generados (`admin` /
`admin123` por defecto) — cámbialos en cuanto inicies sesión.

## 3. Levantar el servidor

```bash
npm run dev     # con nodemon, recarga automática
# o
npm start       # producción
```

Verifica que esté vivo en: `http://localhost:4000/api/health`

## 4. Endpoints principales

| Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | — | `{ usuario, password }` → `{ token, usuario }` |
| GET | `/api/productos` | autenticado | Lista productos |
| POST | `/api/productos` | autenticado | Crea producto |
| PUT | `/api/productos/:id` | autenticado | Edita producto |
| DELETE | `/api/productos/:id` | autenticado | Elimina producto |
| POST | `/api/movimientos` | autenticado | Registra entrada/salida |
| GET | `/api/movimientos?dias=7` | autenticado | Para la gráfica del dashboard |
| POST | `/api/correo/compras` | autenticado | Envía requisición (aún simulado) |
| GET | `/api/usuarios` | administrador | Lista usuarios |
| POST | `/api/usuarios` | administrador | Crea usuario |
| PUT | `/api/usuarios/:id` | administrador | Edita usuario |
| PATCH | `/api/usuarios/:id/estado` | administrador | Activa/desactiva |
| DELETE | `/api/usuarios/:id` | administrador | Elimina usuario |

Todas las rutas protegidas requieren el header:
```
Authorization: Bearer <token>
```

## 5. Conectar con el frontend

En `js/index.js`, `js/usuario.js` y `js/admin.js`, cada bloque marcado con
`// TODO backend` ya trae comentado el `fetch()` esperado — solo hay que
descomentarlo y quitar el `mockRequest()`. El token que regresa
`/api/auth/login` debe guardarse (ej. `localStorage`) y mandarse en el
header `Authorization` de cada petición protegida.

## 6. Git

Si aún no has inicializado el repositorio:

```bash
git init
git add .
git commit -m "Backend inicial: Express + MySQL + JWT"
```

El `.gitignore` ya excluye `node_modules/` y `.env` (nunca subas tus
credenciales reales). Si vas a conectar un repositorio remoto:

```bash
git remote add origin <url-de-tu-repositorio>
git branch -M main
git push -u origin main
```

Sugerencia de flujo de ramas para cuando el equipo crezca:
- `main` — versión estable
- `develop` — integración
- `feature/nombre-de-la-funcionalidad` — trabajo en curso, se mergea a `develop` vía pull request
