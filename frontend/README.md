# Cyber Portfolio — Frontend

Aplicación Angular 22 con TypeScript, SCSS, componentes standalone y Angular SSR. Consume la API NestJS de `../backend`.

## Desarrollo nativo

Inicia primero el backend en el puerto 3000:

```powershell
npm ci
npm start
```

Angular se sirve en `http://localhost:4200` y el proxy dirige `/api` hacia NestJS. `public/runtime-config.js` mantiene `/api` como valor predeterminado para este flujo.

## Build y tests

```powershell
npm test -- --watch=false
npm run build
```

El build de producción ya no necesita una API o base activa. Las rutas públicas con nombre usan `RenderMode.Server` y se resuelven cuando llega una petición. `/admin/**` usa renderizado cliente. El wildcard 404 usa `RenderMode.Prerender`; como sus URL no se pueden enumerar, el recuento esperado sigue siendo cero rutas prerenderizadas, mientras que una URL desconocida conserva HTTP 404 en ejecución.

`npm run build` carga `build.env` con Node 24 y establece `NG_BUILD_CHUNKS_ROLLDOWN=false` para la optimización de chunks, salvo que el proceso ya tenga esa variable definida. Angular 22.1 usa Rolldown por defecto; un build Docker de CI falló al cargar su binding opcional de Linux x64 glibc, `@rolldown/binding-linux-x64-gnu@1.2.0`. El log disponible no muestra la causa interna que distinguiría un paquete ausente de un fallo al cargarlo. La alternativa Rollup conserva la optimización y usa `rollup` como alias de `@rollup/wasm-node@4.63.4`, una dependencia solo de build sin binding nativo obligatorio. El mismo script se ejecuta en Windows, CI y Docker; el Dockerfile copia `build.env` a la etapa de build. El runtime SSR no incluye Rollup.

## CI validation

The `Frontend CI` job in `../.github/workflows/ci.yml` uses Node 24, npm caching keyed by `frontend/package-lock.json`, `npm ci`, `npm test -- --watch=false` (18 tests), and `npm run build`. It has no PostgreSQL service and starts no backend. Runtime SSR and client-rendered administration remain unchanged.

The downstream Docker smoke additionally requests `/`, `/about`, `/projects` and `/projects/bunkerweb-waf` from the real SSR container, checking populated HTML and Spanish UTF-8. A successful push to main delivers that same frontend image to GHCR for future deployment. Manual runs and PRs validate only. See [Phase 7](../docs/PHASE-7-CICD-PLAN.md) for the job graph and first remote run.

## Docker SSR image

`frontend/Dockerfile` instala con `npm ci`, construye Angular en una etapa separada e instala solo dependencias de producción para el runtime. La imagen ejecuta `dist/frontend/server/server.mjs`, no `ng serve`, como el usuario no privilegiado `node`.

Compose configura dos URL distintas:

- `BROWSER_API_BASE_URL=http://localhost:3000/api`: accesible desde el navegador del usuario y expuesta mediante `/runtime-config.js`.
- `SERVER_API_BASE_URL=http://backend:3000/api`: resoluble únicamente por Angular SSR dentro de la red Docker.

El interceptor XSRF de la API permite que las mutaciones autenticadas sigan enviando `X-XSRF-TOKEN` cuando navegador y API usan puertos distintos. Cookies con credenciales, CORS exacto y la validación de Origin del backend permanecen activos.

Desde la raíz del repositorio:

```powershell
Copy-Item .env.docker.example .env.docker
docker compose --env-file .env.docker up --build
```

Abre `http://localhost:4200`. El healthcheck solicita la raíz SSR con `fetch` de Node. Compose aplica sistema raíz de solo lectura, `/tmp` temporal, capacidades eliminadas, `no-new-privileges` e init.

La arquitectura completa y el ciclo operativo están en [PHASE-6-DOCKER-PLAN.md](../docs/PHASE-6-DOCKER-PLAN.md).
