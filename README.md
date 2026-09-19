# Cyber Portfolio

Portfolio profesional de Alejandro Peña y proyecto técnico incremental centrado en desarrollo web, ciberseguridad y evolución hacia DevOps / DevSecOps.

La aplicación presenta experiencia profesional, formación y laboratorios académicos con una separación explícita entre trabajo realizado, resultados confirmados y documentación todavía en revisión.

## Estado actual

El proyecto se encuentra en **Phase 2 — Portfolio Content**. La base del frontend Angular está completa y el contenido provisional ha sido sustituido por información profesional y proyectos reales.

Proyectos publicados:

- Protección de WordPress con BunkerWeb WAF.
- Mini-SOC con Snort y Elastic/Kibana.
- Análisis de InsecureBankv2 con MobSF y OWASP MSTG.
- Secure Portfolio Infrastructure.

## Stack implementado

- Angular 22.
- TypeScript.
- SCSS.
- Angular Router.
- Componentes standalone.
- SSR y prerenderizado.
- Vitest.

## Desarrollo local

Requisitos: Node.js compatible con Angular 22 y npm.

```bash
cd frontend
npm install
npm start
```

La aplicación estará disponible por defecto en `http://localhost:4200`.

## Validación

```bash
cd frontend
npm run build
npm test -- --watch=false
```

El build genera la aplicación de navegador, el servidor SSR y las rutas prerenderizadas.

## Roadmap resumido

1. Angular Frontend — completado.
2. Portfolio Content — fase actual.
3. NestJS Backend.
4. PostgreSQL.
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

Las tecnologías de las fases futuras describen el roadmap. No deben interpretarse como componentes ya implementados.

## Repositorio

[github.com/alejandropena25-beep/cyber-portfolio](https://github.com/alejandropena25-beep/cyber-portfolio)
