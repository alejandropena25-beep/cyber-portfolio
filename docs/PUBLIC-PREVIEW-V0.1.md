# Public Preview v0.1 — preparación

Phase 8.5 prepara la presentación pública del sistema implementado hasta DevSecOps. Este documento registra las condiciones previas para un despliegue posterior; no describe un entorno de producción existente.

## Ya implementado

- Angular SSR, API NestJS y PostgreSQL/Prisma con sesiones administrativas protegidas.
- Contenedores Docker Compose, CI, análisis DevSecOps y publicación en GHCR de imágenes verificadas.
- Presentación pública del sistema y evidencia del hito validado de Phase 8. No hay hosting público de producción en esta fase.

## Evidencia y contenido

- El caso de estudio usa el proyecto `secure-portfolio-infrastructure` servido por la API para resumen, arquitectura, resultados y roadmap. El componente Angular de presentación explica el hito validado de Phase 8. Si cambian los resultados, actualizar ambos y verificar la fuente antes de publicar.
- El bootstrap seed solo escribe si la base está vacía (`SEED_IF_EMPTY=true`). Una base existente no recibe automáticamente el contenido revisado. Antes del preview, revisar el contenido actual y aplicar una actualización controlada mediante el flujo administrativo o un procedimiento de datos revisado; no sobrescribir datos existentes con el seed.
- Los números de tests, hallazgos y SBOM son evidencia histórica del hito validado, no métricas en tiempo real. La asesoría mysql2 sigue abierta y su excepción vence el **2026-10-20**.
- Revisar enlaces, texto del perfil, imágenes y metadatos visibles con el propietario. No publicar capturas, logs ni valores de entorno sin sanitizar.

## Condiciones previas de despliegue

- [ ] Elegir destino de hosting, dominio o subdominio y definir separación entre desarrollo, preview y producción. Revisar `compose.yaml`: ahora expone frontend y backend al host y define `NODE_ENV=development` para backend. No usarlo sin una configuración de producción revisada.
- [ ] Gestionar contraseñas, secretos de sesión y credenciales fuera del repositorio; restringir lectura, rotarlos si procede y confirmar que logs y artefactos no los contienen.
- [ ] Servir frontend y API sobre HTTPS con certificado válido. Configurar el origen real, CORS, cookie de sesión segura y URL pública de API; probar login, CSRF, Origin y logout detrás del punto de entrada elegido.
- [ ] Exponer solo los puertos necesarios, aplicar firewall y mantener PostgreSQL sin puerto público. Limitar el acceso administrativo aunque la ruta no se anuncie; ocultarla en navegación no es un control de autorización.
- [ ] Definir backup cifrado de PostgreSQL, retención, acceso y prueba de restauración antes de aceptar datos editables. Documentar responsable y frecuencia.
- [ ] Definir rollback de las tres imágenes por digest y de datos/migraciones. Probar un retorno compatible; las migraciones de esquema no se deshacen automáticamente al cambiar una imagen.
- [ ] Exigir CI verde y revisión de hallazgos/expiraciones antes de liberar. Seleccionar los tres digests de una misma ejecución exitosa de main; la etiqueta `main` es un alias móvil.
- [ ] Confirmar configuración de entorno de producción, encabezados/caché, salud y comportamiento SSR/API en el dominio elegido. Repetir smoke y una revisión de accesibilidad y móvil con la URL final.

No se introduce configuración de proveedor, Kubernetes ni dashboard operativo en esta fase.
