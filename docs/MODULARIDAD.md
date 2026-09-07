# Módulos por usuario

Cada usuario configura sus funciones desde el botón **Módulos**. Puede cambiar varios interruptores y pulsar **Guardar configuración**, o cancelar sin modificar la cuenta. Los errores mantienen el formulario abierto para reintentar. Proyectos es la base y siempre permanece disponible.

| Módulo | Funciones opcionales |
| --- | --- |
| Clientes | Fichas, búsqueda, importación de contactos y datos de cliente en proyectos y paneles. |
| Tareas | Listas, prioridades y avisos de tareas. |
| Entregas | Fechas de entrega, avisos y panel de entregas. |
| Economía | Presupuestos, honorarios, horas, cobros y comisiones. |
| Documentos | Imágenes y archivos PDF de proyectos y comisiones. |
| Proveedores | Contactos de proveedores dentro de la ficha del proyecto. |

Todos los módulos están activos inicialmente. Nombre, dirección, fecha de inicio, tipo, fases, estado, importancia, notas e historial del proyecto siguen disponibles al desactivar los módulos opcionales. Los textos históricos ya guardados se conservan.

**Hoy en el estudio** queda arriba, antes de las fichas. **Economía general** y **Resumen del estudio** aparecen al final, antes del pie. Sus contenidos respetan los módulos activos; Economía general se oculta al desactivar Economía.

## Persistencia y sesión

Las preferencias se guardan en `auth.users.user_metadata.fuente_studio_modules`. El catálogo y sus valores predeterminados se definen en `src/modules/preferences/model.js`. Solo se aceptan claves conocidas con valores booleanos; los módulos ausentes se consideran activos para mantener el comportamiento de cuentas existentes.

El repositorio comprueba la sesión y consulta el usuario antes de guardar. La escritura usa un JWT capturado para que un cambio de cuenta durante la petición no redirija las preferencias a otra persona. Utiliza la operación [PUT /user de Supabase Auth](https://github.com/supabase/auth#put-user), actualizando únicamente el objeto de módulos dentro de los metadatos.

La interfaz actualiza el perfil tras guardar. También lo consulta al recibir eventos de sesión y al abrir la aplicación, por lo que la configuración se recupera al entrar desde otro dispositivo. Una notificación de almacenamiento local solicita la actualización en otras pestañas de la misma cuenta. Al cambiar de usuario se cierran los editores abiertos; las respuestas de perfiles anteriores no sustituyen al usuario actual.

No hacen falta nuevas tablas ni migraciones. La selección es una preferencia que controla cada usuario. Si más adelante los módulos dependen de un administrador o de un plan contratado, habrá que añadir ese control y su validación en el servidor.

## Conservación de datos

Desactivar un módulo oculta sus controles y paneles. Sus registros y archivos permanecen guardados y vuelven a mostrarse al activarlo.

Antes de guardar una ficha, `conservarDatosDesactivados` recupera del proyecto original los campos correspondientes a módulos desactivados. Esto evita que un formulario parcial borre tareas, contactos, documentos o cantidades. Cuando Economía está activa y Documentos desactivado, los PDF de las comisiones se conservan por su identificador; las comisiones nuevas comienzan sin adjuntos.

El PDF de una comisión necesita Economía y Documentos activos para mostrarse o editarse. El PDF general y la imagen del proyecto solo dependen de Documentos. La configuración no impide borrar un proyecto completo mediante su acción de eliminación.

## Organización del código

```text
src/modules/
  projects/
    index.js              Entrada pública
    repository.js         Carga y resolución de archivos privados
  preferences/
    index.js              Entrada pública
    model.js              Catálogo, valores predeterminados y conservación de datos
    repository.js         Guardado de preferencias de la cuenta
    ModulesSettings.jsx   Formulario de configuración
    preferences.css       Estilos compartidos con el resto de formularios
```

`cargarProyectosDeUsuario(usuarioId)` filtra por usuario y resuelve las direcciones temporales de imágenes, presupuestos y PDF de comisiones. La pantalla controla la carga, los errores y el estado de React.

Los componentes reciben `modulos` desde App. La sesión, Supabase, las traducciones, los estilos de formularios y el acceso a archivos son compartidos. Las traducciones del selector están disponibles en los 20 idiomas de la aplicación.

La separación del código sigue siendo incremental: el guardado de proyectos y varios componentes continúan en sus ubicaciones anteriores. Los siguientes pasos son extraer las operaciones de cada módulo y delimitar sus campos de escritura, manteniendo los filtros de usuario. La relación entre clientes y proyectos todavía utiliza el nombre del cliente.

## Comprobaciones

`npm test` cubre las preferencias independientes por cuenta, valores predeterminados, errores, cambios de sesión durante el guardado, conservación de datos de módulos desactivados y renderizado de formularios y tarjetas en distintas combinaciones. La carga modular también prueba los filtros y archivos privados.

Estas pruebas utilizan clientes y peticiones simulados; no modifican cuentas reales. `npm run build` comprueba la compilación. La comprobación de políticas y persistencia contra una instancia real de Supabase requiere una sesión de prueba.
