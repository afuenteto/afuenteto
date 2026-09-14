# Sincronización de datos

La app escucha cambios de proyectos, clientes, deudas y pagos mediante Supabase Realtime. Cada aviso provoca una consulta con la sesión y las políticas RLS existentes; el contenido del aviso no se incorpora directamente a la pantalla.

Ejecutar `supabase_migration_realtime.sql` en el SQL Editor del proyecto Supabase y publicar la versión nueva de la aplicación. Abrir esa versión en cada dispositivo con la misma cuenta. Probar creando, modificando y eliminando un registro en un dispositivo y comprobándolo en otro.

Hay una consulta de respaldo cada 30 segundos mientras la app esté visible y con conexión, además de consultas al recuperar conexión o volver a la ventana. No se garantiza ejecución en segundo plano cuando el teléfono suspende la app.

La actualización de proyectos y clientes se aplaza durante la edición de fichas o guardados. Los formularios abiertos no se sustituyen con datos remotos. Esto no resuelve conflictos si dos dispositivos editan simultáneamente la misma ficha: sigue vigente el comportamiento de guardado existente.

Los resúmenes derivan de los datos actualizados. El orden de los módulos de entrada y las preferencias almacenadas en localStorage siguen siendo locales a cada navegador. La sincronización no descarga automáticamente nuevas versiones del código ni recarga formularios abiertos.

Validación local: pruebas existentes y compilación. La recepción real entre dispositivos requiere activar la publicación en Supabase y probar con dos sesiones de la misma cuenta.
