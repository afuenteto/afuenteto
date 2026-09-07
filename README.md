# Afuenteto · Panel de proyectos

Aplicación React y Vite para gestionar proyectos de interiorismo, clientes, tareas, cobros, comisiones y archivos adjuntos.

Los datos se guardan en **Supabase**, asociados al usuario autenticado. Las imágenes se suben al bucket imagenes-proyectos y los PDF a presupuestos. La aplicación utiliza sus URL públicas. No incluye exportación/importación de copias locales.

## Desarrollo

Utiliza Node.js 24, la misma versión configurada en el workflow de publicación.

1. Instala las dependencias con npm ci.
2. Arranca el entorno con npm run dev.
3. Abre la dirección que muestra Vite.

La configuración del cliente Supabase está en src/supabase.js.

## Organización modular

El botón **Módulos** permite que cada usuario active o desactive Clientes, Tareas, Entregas, Economía, Documentos y Proveedores. Proyectos siempre está disponible. La selección se guarda en su cuenta de Supabase y desactivar una función conserva sus datos. Todas están activadas inicialmente. No requiere una migración de base de datos.

La carga de proyectos está en `src/modules/projects` y las preferencias en `src/modules/preferences`. El mapa de módulos, las dependencias y los siguientes pasos están en [docs/MODULARIDAD.md](docs/MODULARIDAD.md).

**Hoy en el estudio** aparece antes de las fichas. **Economía general** y **Resumen del estudio** aparecen después de ellas, justo antes del pie; los paneles respetan los módulos activos.

## Idiomas

El selector **Idioma / Language**, situado al final de la aplicación a la izquierda, permite cambiar entre 20 idiomas. Con una sesión iniciada, el botón **Salir** aparece a su derecha en la misma fila. El selector también está disponible antes de iniciar sesión. La selección se conserva en este navegador y se sincroniza entre sus pestañas. Español sigue siendo el idioma inicial. Árabe y urdu utilizan escritura de derecha a izquierda; fechas y números se adaptan al idioma. Los importes siguen expresados en euros.

Los diccionarios de `src/locales` se incluyen en la compilación: no se envían proyectos, nombres ni documentos a servicios de traducción. Los datos escritos por el usuario y los textos del historial ya guardados conservan su contenido original. No requiere ninguna migración de Supabase.

Las traducciones parten de una traducción automática, con revisión de terminología del catálogo inglés; conviene una revisión nativa antes de una publicación comercial. Para actualizar los catálogos, añade las mismas claves a `es.json` y `en.json` y ejecuta `node scripts/translate-locales.mjs` (requiere conexión y envía solo los textos de interfaz del catálogo inglés a Google). Es posible limitarlo a idiomas concretos, por ejemplo `node scripts/translate-locales.mjs fr de`. Revisa los resultados y ejecuta `npm test`.

## Comprobaciones

- npm test: conservación de campos, preferencias por usuario, errores y cambios de sesión, carga de proyectos, validación numérica, ordenación con filtros, fechas locales, traducciones y renderizado con módulos activos y desactivados.
- npm run build: compilación de producción.
- npm run preview: sirve la compilación para comprobarla en el navegador.

Las pruebas no sustituyen la comprobación de sesión, permisos y guardado contra una instancia real de Supabase.

## Base de datos y publicación

La aplicación utiliza las tablas proyectos, clientes y perfil_estudio. El repositorio contiene migraciones parciales para comisiones y proyectos finalizados; no incluye el esquema completo ni las políticas de acceso para crear una instalación desde cero. Los filtros de usuario del frontend complementan las políticas de Supabase, pero no las sustituyen.

El workflow .github/workflows/deploy.yml genera y publica dist en GitHub Pages. Las rutas relativas permiten desplegar en una subcarpeta. El manifiesto y los iconos se sirven desde public.

La recuperación de contraseña requiere que la URL de la aplicación esté autorizada entre las redirecciones de Supabase Authentication. Al volver desde el correo, la aplicación permite introducir una nueva contraseña.

Las operaciones que cambian el nombre de un cliente y sus proyectos utilizan varias consultas con restauración en caso de fallo. Para garantizar atomicidad ante interrupciones de red, sería necesario trasladarlas a una transacción en la base de datos. La ordenación también se guarda mediante varias consultas; ante un fallo parcial, la aplicación vuelve a cargar el orden persistido.

Los botones legales y de contacto del pie todavía no tienen contenido asociado.
