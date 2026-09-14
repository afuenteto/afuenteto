# Deudas y módulos de la entrada

La entrada muestra Hoy en el estudio, Proyectos, Deudas, Economía general (si está activada) y Resumen del estudio. Todos empiezan cerrados. El título abre o pliega cada módulo; el asa de puntos permite moverlo con ratón, pantalla táctil o teclado. El orden se conserva en este navegador por usuario. Plegar conserva el contenido y los formularios ya abiertos; recargar vuelve a cerrar todos los módulos.

El módulo Proyectos contiene los filtros y el arrastre de fichas. El orden de módulos y el orden personalizado de proyectos son independientes. El resumen puede abrir Proyectos cuando se selecciona una fase.

## Activar Deudas

1. Abrir el SQL Editor del proyecto Supabase utilizado por la aplicación.
2. Ejecutar el contenido completo de `supabase_migration_deudas.sql`.
3. Recargar la app y abrir Deudas.

La migración crea `deudas` y `pagos_deuda`, índices, políticas por propietario y un trigger de validación. No se ha ejecutado desde este entorno. Hasta aplicarla, la entrada sigue funcionando y Deudas muestra un error de carga al abrirlo.

Se registran concepto, acreedor e importe inicial. Los pagos tienen importe y fecha. El saldo se calcula a partir del importe inicial menos todos los pagos; eliminar un pago lo corrige. Eliminar una deuda elimina también su historial de pagos, previa confirmación. No se realizan transferencias bancarias: es un registro de pagos introducidos por el usuario.

Los importes son euros con dos decimales. El cliente calcula en céntimos y la base utiliza `numeric(14,2)`. El trigger bloquea la fila de deuda mientras valida cada pago, verifica su propietario e impide superar el importe inicial con pagos simultáneos. No se conceden actualizaciones directas de importes: una corrección se realiza eliminando el registro incorrecto y registrándolo de nuevo.

## Comprobaciones

`npm test` cubre los cálculos, validación y errores del repositorio con cliente simulado, normalización y movimiento de módulos, la entrada cerrada y la integración sin cabeceras duplicadas de Economía y Resumen. `npm run build` comprueba la compilación.

Pendiente en una instancia de prueba real: ejecutar el SQL, crear una deuda, añadir dos pagos, eliminar uno, comprobar el saldo tras recargar y verificar que una segunda cuenta no puede leer o modificar los registros de la primera.
