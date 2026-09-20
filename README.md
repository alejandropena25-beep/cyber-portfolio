# Cyber Portfolio

[![CI](https://github.com/alejandropena25-beep/cyber-portfolio/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/alejandropena25-beep/cyber-portfolio/actions/workflows/ci.yml)

Portfolio profesional de Alejandro Peña y proyecto técnico incremental centrado en desarrollo web, ciberseguridad y evolución hacia DevOps / DevSecOps.

La plataforma utiliza Angular SSR para la experiencia pública, una API NestJS para contenido y administración, y PostgreSQL mediante Prisma como fuente de verdad.

## Estado actual

El proyecto se encuentra en **Phase 7 — CI/CD**, implementada localmente y pendiente de validación real en GitHub. Las fases 1 a 6 están completadas, incluida la contenerización con Docker Compose.

El workflow `CI` valida PR hacia `main`, pushes a `main` y ejecuciones manuales. Solo un push a `main` que supere todos los checks publica las imágenes verificadas en GHCR. Esto es entrega continua de artefactos; todavía no hay despliegue. El badge mostrará el estado remoto cuando el workflow esté en GitHub; no acredita las validaciones locales.

## CI y entrega de imágenes

```text
Repository checks → Backend CI ─┐
                  → Frontend CI ┴→ Docker smoke → Publish verified images (push main)
```

Node 24 y `npm ci` validan los lockfiles. Backend usa PostgreSQL 18 desechable en `127.0.0.1:55432/cyber_portfolio_test`; el guard rechaza el puerto 5432. Frontend construye SSR sin API ni base activa. El smoke construye los Dockerfiles reales y comprueba migraciones, seed, healthchecks, API, SSR y UTF-8 antes de limpiar sus recursos aislados.

Se entregan `ghcr.io/<owner>/<repo>-backend`, `-backend-tools` y `-frontend`, con `sha-<commit-completo>-<run-id>-<intento>` y el alias `main` cuando corresponde. Se transfieren las imágenes comprobadas entre jobs, sin reconstruirlas para publicar. No hay secretos personalizados: GHCR utiliza el `GITHUB_TOKEN` temporal con `packages: write` solo en el job de publicación.

Para reproducir el smoke con Docker activo y Node 24, desde la raíz:

```powershell
node --test backend/test/database-safety.test.cjs
node scripts/ci/compose-smoke.mjs
```

El helper reserva `127.0.0.1:13000` y `127.0.0.1:14200`, genera un proyecto `cyber-portfolio-ci-<aleatorio>` y nunca carga `.env.docker`. Su volumen es independiente de `cyber-portfolio_postgres_data`. Consulta [el plan de Phase 7](docs/PHASE-7-CICD-PLAN.md) para el primer run, los checks requeridos, diagnóstico y el traspaso futuro a staging.

## Inicio rápido con Docker

Docker sustituye la necesidad de instalar PostgreSQL localmente para este flujo. Se requiere Docker Desktop con Docker Compose v2.

```powershell
Copy-Item .env.docker.example .env.docker
```

Edita `.env.docker` y reemplaza ambos marcadores de contraseña por el mismo secreto local fuerte. En `DATABASE_URL`, codifica como URL cualquier carácter especial. Después:

```powershell
docker compose --env-file .env.docker up --build
```

La aplicación queda en `http://localhost:4200` y la API en `http://localhost:3000/api`. PostgreSQL no publica ningún puerto. En el primer arranque, Compose espera a PostgreSQL, aplica `prisma migrate deploy`, carga el contenido confirmado si la base está vacía, inicia NestJS y finalmente Angular SSR.

Crea el administrador de forma interactiva y sin almacenar su contraseña:

```powershell
docker compose --env-file .env.docker --profile tools run --rm admin-create
```

Operaciones habituales:

```powershell
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker down
```

`docker compose down` conserva el volumen. **`docker compose down -v` elimina de forma destructiva la base Docker** y solo debe usarse intencionadamente para probar un arranque completamente nuevo.

Consulta [el plan de Phase 6](docs/PHASE-6-DOCKER-PLAN.md) para configuración, seguridad, persistencia, reconstrucción y diagnóstico.

## Arquitectura Docker

```text
Browser
  ├── http://localhost:4200 ── Angular SSR
  └── http://localhost:3000/api ── NestJS ── Prisma ── PostgreSQL
                                  ▲                    (red interna)
Angular SSR ── http://backend:3000/api
```

- `frontend` y `backend` ejecutan artefactos de producción como el usuario no privilegiado `node`.
- `database` usa `postgres:18-bookworm`, un usuario dedicado y el volumen `postgres_data`.
- `migrate` y `seed` son tareas de una ejecución; un fallo impide que arranque la API.
- Las aplicaciones usan sistema raíz de solo lectura, `/tmp` temporal, capacidades Linux eliminadas y `no-new-privileges`.

Las rutas públicas con nombre usan SSR en tiempo de petición. Así reflejan ediciones administrativas sin reconstruir Angular y el build de la imagen frontend no requiere API ni base activas. Las rutas `/admin/**` siguen siendo client-side. El wildcard 404 conserva `RenderMode.Prerender`; no genera rutas enumerables durante el build y mantiene la respuesta HTTP 404 en ejecución.

## Desarrollo nativo

El flujo existente sigue disponible. Configura PostgreSQL y `backend/.env` según [backend/README.md](backend/README.md), y ejecuta:

```powershell
cd backend
npm run start:dev
```

En otra terminal:

```powershell
cd frontend
npm start
```

Angular se sirve en `http://localhost:4200`; el proxy de desarrollo resuelve `/api` hacia NestJS en `http://localhost:3000`.

## API

La API pública mantiene `GET /api/health`, `/api/projects`, `/api/projects/:slug` y `/api/profile`. La administración usa `/api/auth/*` y `/api/admin/*`, sesiones HttpOnly, validación estricta de Origin y CSRF ligado a la sesión.

## Build y tests nativos

```powershell
cd backend
npm run prisma:generate
npm run build
# Configurar primero la base desechable y TEST_DATABASE_URL en 127.0.0.1:55432,
# siguiendo backend/README.md. El puerto 5432 se rechaza para los tests.
npm test

cd ../frontend
npm test -- --watch=false
npm run build
```

El build frontend ya no necesita que NestJS o PostgreSQL estén activos: los datos públicos se obtienen durante SSR de ejecución, no durante el build.

## Documentación

- [Arquitectura actual](docs/ARCHITECTURE.md)
- [Plan de Phase 4](docs/PHASE-4-DATABASE-PLAN.md)
- [Plan de Phase 5](docs/PHASE-5-AUTH-PLAN.md)
- [Plan de Phase 6](docs/PHASE-6-DOCKER-PLAN.md)
- [Plan de Phase 7 y primera validación remota](docs/PHASE-7-CICD-PLAN.md)

## Roadmap resumido

1. Angular Frontend — completado.
2. Portfolio Content — completado.
3. NestJS Backend — completado.
4. PostgreSQL + Prisma — completado.
5. Administración y autenticación — completado.
6. Docker / Docker Compose — completado.
7. CI/CD con GitHub Actions — fase actual; pendiente de validación remota.
8. DevSecOps.
9. Kubernetes.
10. WAF e infraestructura de seguridad.
11. SIEM con Wazuh.
12. Monitorización con Prometheus y Grafana.
13. Respuesta automatizada controlada.
14. Producción.

## Repositorio

[github.com/alejandropena25-beep/cyber-portfolio](https://github.com/alejandropena25-beep/cyber-portfolio)
