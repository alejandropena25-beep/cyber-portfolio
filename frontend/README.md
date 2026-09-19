# Cyber Portfolio — Frontend

Aplicación Angular del portfolio profesional de Alejandro Peña. Consume la API NestJS situada en `../backend`.

## Stack

Angular 22, TypeScript, SCSS, Angular Router, componentes standalone y SSR / prerenderizado.

## Desarrollo

Primero inicia el backend en el puerto 3000. Después:

```bash
npm install
npm start
```

Angular se sirve en `http://localhost:4200` y el proxy de desarrollo dirige `/api` a NestJS.

## Build y tests

```bash
npm test -- --watch=false
npm run build
```

El backend debe estar disponible en `127.0.0.1:3000` durante el build para que el prerender pueda obtener los proyectos y sus rutas.

La arquitectura, los endpoints y el roadmap se documentan en el [README principal](../README.md).
