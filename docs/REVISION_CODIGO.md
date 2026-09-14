# Revisión de código · 14 de septiembre de 2026

Se revisaron la aplicación React, los módulos de proyectos y preferencias, el calendario, los adjuntos, la sesión, los formularios, los estilos, los catálogos de idiomas, las pruebas, las migraciones disponibles, la función de contacto y la configuración de publicación. No se accedió a cuentas reales ni se ejecutaron migraciones o envíos de correo.

## Cambios aplicados

| Área | Resultado |
| --- | --- |
| Carga inicial | Recharts y el contenido del gráfico se descargan al abrir «Economía general». Un error de descarga queda contenido en ese apartado. |
| Archivos privados | Firma agrupada por bucket, con rutas deduplicadas y lotes de hasta 100 archivos. Se comprueban errores globales, individuales y respuestas incompletas. |
| Imágenes y documentos | Las respuestas de guardado y archivado conservan los enlaces ya resueltos cuando la ruta no cambia. Quitar una imagen también borra su ruta del proyecto. |
| Orden de proyectos | Solo se escriben las posiciones que cambian. Se mantiene la recarga ante un fallo parcial. |
| Cálculos | Se reutilizan listas filtradas, ordenaciones, agenda y formateadores de fecha. Todas las pantallas usan el mismo criterio para el importe contratado. |
| Inicio | La animación conserva su duración mínima, contando el tiempo empleado en cargar datos. Ya no añade siempre 1,3 segundos después de la respuesta. |
| Sesión y perfil | El perfil se consulta al cambiar de cuenta, sin recargarlo por cada nuevo objeto de sesión. Se ignoran respuestas obsoletas de carga y se añaden comprobaciones de cuenta antes de actualizar las vistas tras escrituras. |
| Formularios | Se impide cerrar la entrega durante el guardado y se bloquean acciones incompatibles en la ficha del cliente. Los fallos inesperados del guardado de perfil liberan su estado de carga. |
| Fechas | Una validación común rechaza fechas imposibles y calcula días naturales. La fecha de una tarea completada se interpreta como fecha local, evitando mostrar el día anterior en otras zonas horarias. |
| Limpieza | Se eliminan tres funciones antiguas de persistencia sin llamadas, variables sin uso, un elemento vacío y 11 reglas CSS obsoletas o sustituidas. Se eliminan 71 líneas en blanco redundantes sin alterar el AST. |
| Pruebas y publicación | Las pruebas de renderizado no compiten por el puerto de HMR. GitHub Actions usa `npm ci` y ejecuta las pruebas antes de compilar y publicar. |
| SQL | Las restricciones de estado e importancia pueden volver a ejecutarse. La migración histórica de comisiones ya no vuelve público el bucket ni reinstala políticas amplias. Los permisos por propietario siguen centralizados en la migración de almacenamiento privado. |

## Medición y comprobaciones

Comparación con la compilación anterior a esta revisión, que ya incluía la nueva agenda:

| Recurso | Antes | Después |
| --- | ---: | ---: |
| JavaScript inicial | 1.224,87 KB | 863,10 KB |
| JavaScript inicial con gzip | 351,55 KB | 246,04 KB |
| Gráficos bajo demanda | Incluidos en el inicial | 361,96 KB / 106,40 KB gzip |
| CSS | 40,35 KB | 39,34 KB |

La reducción del JavaScript inicial es del 29,5 % sin comprimir y del 30,0 % con gzip. No representa una medición del tiempo de carga de un dispositivo real. Al abrir el gráfico se descarga su módulo adicional.

- `npm test`: 48 pruebas aprobadas, sin fallos.
- `npm run build`: compilación correcta. Vite conserva el aviso de que el módulo inicial supera 500 KB.
- Análisis de sintaxis e importaciones de los 40 archivos JavaScript/JSX de `src`, los tres CSS y los 20 catálogos JSON, sin variables locales sin uso detectadas por el análisis de bindings.
- Sintaxis TypeScript de la función de correo comprobada con el parser; no equivale a ejecutar o comprobar tipos con Deno.

## Límites y trabajo que requiere comprobar el entorno real

- El repositorio contiene un esquema SQL parcial. No se han podido verificar los índices, las políticas efectivamente instaladas, la latencia, los límites o los planes de consulta de la base de datos real. Las modificaciones de SQL son locales y no necesitan ejecutarse para probar los cambios de interfaz.
- Renombrar un cliente y sus proyectos utiliza varias escrituras con restauración. La ordenación también usa varias escrituras. Una garantía transaccional exige una operación de servidor y una migración contrastada con el esquema real.
- Guardar el mensaje de contacto y enviar el correo son operaciones separadas. Si el correo falla después del insert, un reintento puede crear otro registro. Resolverlo completamente requiere idempotencia coordinada entre el formulario y la función de correo.
- Los enlaces privados duran una hora. Esta revisión conserva enlaces existentes al guardar, pero no incorpora renovación automática para una pestaña abierta indefinidamente. Una nueva carga vuelve a firmarlos.
- Los 20 idiomas siguen disponibles sin peticiones adicionales. Cargar solo el idioma activo reduciría más el módulo inicial, pero requeriría gestionar explícitamente la carga asíncrona y sus fallos en el selector.
- No se han verificado el guardado y las políticas con una cuenta real, el envío de correo, ni la importación de calendarios en un teléfono. No se ha publicado ni enviado ningún cambio remoto.
