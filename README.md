# Cyber Portfolio

Portfolio profesional de Alejandro Peña y proyecto técnico incremental centrado en desarrollo web, ciberseguridad y evolución hacia DevOps / DevSecOps.

La plataforma utiliza Angular para la experiencia pública y una API NestJS para servir el perfil profesional y los proyectos confirmados.

## Estado actual

El proyecto se encuentra en **Phase 4 - PostgreSQL + Prisma**, completada y validada con PostgreSQL local.

Completado:

- Phase 1: base del frontend Angular.
- Phase 2: contenido profesional y proyectos reales.
- Phase 3: API REST pública e integración de Angular con el backend.
- Phase 4: persistencia PostgreSQL con Prisma, migraciones, seed y pruebas con base de datos.

PostgreSQL forma parte de Phase 4. Las fases posteriores no se han iniciado.

## Arquitectura local

```text
Navegador
   │
   ├── http://localhost:4200 ── Angular
   │                              │
   │                              └── /api (proxy de desarrollo)
   │
   └────────────────────────── http://localhost:3000/api ── NestJS
```

NestJS consulta PostgreSQL mediante Prisma como fuente de contenido. Angular consume esa API tanto en navegador como durante SSR y prerenderizado.

## Stack implementado

Frontend:

- Angular 22.
- TypeScript.
- SCSS.
- Angular Router.
- Componentes standalone.
- SSR y prerenderizado.
- Vitest.

Backend:

- NestJS 12.
- TypeScript estricto.
- REST API.
- Prisma 7.10.0 y PostgreSQL 18 local.
- Jest y Supertest para pruebas HTTP.

## Instalación

Instala las dependencias de cada aplicación:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Desarrollo local

Primero configura PostgreSQL y `backend/.env`, genera el cliente, aplica las migraciones y ejecuta el seed siguiendo [backend/README.md](backend/README.md). Después inicia la API en una terminal:

```bash
cd backend
npm run start:dev
```

La API estará disponible en `http://localhost:3000/api`.

Inicia Angular en otra terminal:

```bash
cd frontend
npm start
```

La aplicación estará disponible en `http://localhost:4200`. El servidor de desarrollo redirige `/api` hacia NestJS.

## API pública

| Método | Ruta                  | Descripción                            |
| ------ | --------------------- | -------------------------------------- |
| GET    | `/api/health`         | Estado mínimo de disponibilidad.       |
| GET    | `/api/projects`       | Resúmenes de los proyectos públicos.   |
| GET    | `/api/projects/:slug` | Contenido completo de un proyecto.     |
| GET    | `/api/profile`        | Perfil profesional público confirmado. |

Un `slug` de proyecto inexistente devuelve HTTP 404. La API no expone endpoints de escritura, administración o autenticación.

## Build y tests

Backend:

```bash
cd backend
npm run build
npm test
```

Frontend:

```bash
cd frontend
npm test -- --watch=false
npm run build
```

El backend debe estar ejecutándose en `127.0.0.1:3000` durante el build del frontend. El prerender consulta la API para obtener los proyectos y generar sus rutas estáticas.

## Configuración de la API

Angular centraliza las URLs en `frontend/src/environments/environment.ts`:

- Navegador: `/api`, resuelto por el proxy durante el desarrollo.
- SSR / prerender: `http://127.0.0.1:3000/api`.

La URL del entorno de producción se decidirá cuando se defina la topología de despliegue. No hay credenciales ni secretos en esta configuración.

CORS acepta el origen local de Angular, `http://localhost:4200`, y la API desactiva la cabecera `X-Powered-By`.

## Roadmap resumido

1. Angular Frontend — completado.
2. Portfolio Content — completado.
3. NestJS Backend - completado.
4. PostgreSQL + Prisma - completado y validado.
5. Administración y autenticación.
6. Docker / Docker Compose.
7. CI/CD con GitHub Actions.
8. DevSecOps.
9. Kubernetes.
10. WAF e infraestructura de seguridad.
11. SIEM con Wazuh.
12. Monitorización con Prometheus y Grafana.
13. Respuesta automatizada controlada.
14. Producción.

Las tecnologías futuras no forman parte todavía de la implementación.

## Documentación

- [Arquitectura actual](docs/ARCHITECTURE.md)
- [Plan de Phase 4](docs/PHASE-4-DATABASE-PLAN.md)

## Repositorio

[github.com/alejandropena25-beep/cyber-portfolio](https://github.com/alejandropena25-beep/cyber-portfolio)
