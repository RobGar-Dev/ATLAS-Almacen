# ATLAS — Despliegue en producción (VPS + Docker)

Arquitectura: un único servidor, tres contenedores.

```
Internet
   │
   │  puertos 80/443 (los ÚNICOS expuestos)
   ▼
┌─────────────┐
│    Caddy    │  HTTPS automático (Let's Encrypt) + proxy + frontend estático
└──────┬──────┘
       │  red interna de Docker (no expuesta al host ni a internet)
       ▼
┌─────────────┐        ┌─────────────┐
│   backend   │───────▶│    mysql    │
│  (Express)  │        │             │
└─────────────┘        └─────────────┘
```

`backend` y `mysql` **no publican ningún puerto al host** — ni con `curl localhost:4000` desde el propio servidor los alcanzas fuera de Docker. Solo son visibles entre ellos por nombre de servicio, dentro de la red `atlas-internal`. Lo único que un atacante puede tocar desde internet es Caddy en 80/443.

## 1. Requisitos previos

- Un VPS con Docker y Docker Compose instalados (Ubuntu 22.04+ recomendado).
- Un dominio con un registro DNS **A** apuntando a la IP del VPS (para HTTPS automático). Si todavía no tienes uno, puedes probar todo en HTTP plano — ver sección 5.

## 2. Configura las variables de entorno

En la raíz del proyecto (junto a `docker-compose.yml`):

```bash
cp .env.example .env
nano .env   # o el editor que prefieras
```

Rellena **todas** las contraseñas con valores únicos y largos — nunca reuses `admin123` ni nada parecido a lo que usaste en desarrollo. Para generar un `JWT_SECRET` fuerte:

```bash
openssl rand -hex 32
```

## 3. Levanta todo

```bash
docker compose up -d --build
```

Espera a que MySQL reporte `healthy` (puede tardar 20-30s la primera vez):

```bash
docker compose ps
```

## 4. Crea el usuario administrador

El seed no corre solo — hazlo una vez, dentro del contenedor ya corriendo:

```bash
docker compose exec backend npm run seed
```

Copia el usuario/contraseña que imprime y **cámbialos de inmediato** desde el panel de administrador una vez que inicies sesión (Editar usuario → nueva contraseña).

## 5. Prueba sin dominio (opcional, antes de ir a producción)

Si quieres probar todo el stack en tu VPS o en tu máquina antes de tener un dominio real, en tu `.env`:

```
DOMAIN=:80
```

Caddy escuchará en HTTP plano en el puerto 80, sin intentar pedir un certificado (Let's Encrypt necesita un dominio real y verificable). Cuando tengas el dominio, cambia `DOMAIN` a tu dominio real y `CORS_ORIGIN` a `https://tu-dominio.com`, y reinicia:

```bash
docker compose up -d
```

## 6. Verifica

- `https://tu-dominio.com` → debe cargar el login.
- `https://tu-dominio.com/api/health` → `{"success":true,"message":"ATLAS API activa"}`.
- Candado de HTTPS válido en el navegador (Caddy lo gestiona solo).

## 7. Actualizar el sistema después de cambios en el código

```bash
git pull
docker compose up -d --build
```

Docker solo reconstruye lo que cambió; MySQL conserva sus datos en el volumen `mysql_data` sin importar cuántas veces reconstruyas `backend` o `proxy`.

## 8. Backups de la base de datos

El volumen `mysql_data` es lo único con estado real. Respáldalo periódicamente:

```bash
docker compose exec mysql mysqldump -u root -p"$DB_ROOT_PASSWORD" atlas_almacen > backup-$(date +%F).sql
```

Considera automatizarlo con un cron job que corra ese comando y suba el resultado a almacenamiento externo (no solo al mismo VPS).

---

## Checklist de seguridad del SERVIDOR (esto Docker no te lo da solo)

Todo lo anterior protege la aplicación. Lo siguiente protege la máquina donde vive:

- [ ] **Firewall**: solo abre 22 (SSH), 80 y 443.
  ```bash
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```
- [ ] **SSH sin contraseña**: usa solo llaves públicas, deshabilita login por contraseña y el login directo de `root` (`/etc/ssh/sshd_config`: `PasswordAuthentication no`, `PermitRootLogin no`).
- [ ] **fail2ban**: bloquea IPs con intentos repetidos de SSH.
  ```bash
  sudo apt install fail2ban
  ```
- [ ] **Actualizaciones automáticas** del sistema operativo (`unattended-upgrades` en Ubuntu/Debian).
- [ ] **Usuario no-root** para operar el VPS día a día (no trabajes como `root` directamente).
- [ ] **Actualiza las imágenes Docker** periódicamente — `docker compose pull && docker compose up -d --build` trae parches de seguridad de `node:20-alpine`, `mysql:8.0` y `caddy:2-alpine`.
- [ ] **Backups fuera del servidor** — un backup que vive en el mismo VPS no te salva si el VPS se pierde completo.