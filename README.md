# Panel de proyectos de interiorismo

App personal para ver de un vistazo qué proyectos tienes activos, en qué fase están, su presupuesto, tareas pendientes y proveedores.

## ⚠️ Importante: dónde se guardan los datos

Esta app guarda todo en el **`localStorage` del navegador**, tal y como se pidió (sin cuentas, sin servidor). Esto tiene una consecuencia real que conviene tener clara antes de usarla en serio:

- Los datos **solo existen en el navegador y dispositivo donde los introduces**. Si abres la app en el móvil, no verás los proyectos que creaste en el ordenador.
- Si borras el historial/datos de navegación de ese navegador, **se pierden los proyectos**.
- No hay copia en la nube ni en GitHub: subir el código a GitHub no sube tus datos (y así debe ser, por privacidad).

Por eso la app incluye botones de **"Exportar copia"** (descarga un `.json` con todos tus proyectos) e **"Importar"** (para restaurar esa copia, o pasar los datos a otro dispositivo/navegador). Recomiendo exportar una copia de vez en cuando, especialmente antes de cambiar de navegador u ordenador.

Si en el futuro quieres que los datos se sincronicen solos entre dispositivos, se puede añadir una base de datos gratuita (p. ej. Supabase); no está incluido ahora porque se pidió explícitamente la opción sencilla sin cuentas.

## Qué incluye

- **Panel principal**: tarjetas con nombre, cliente, fase (Diseño → Presupuesto → Ejecución → Entrega), barra de presupuesto gastado/total, tareas pendientes y aviso si la entrega está próxima o vencida.
- **Ficha de proyecto**: nombre, cliente, teléfono, email, dirección, fecha de inicio, fecha de entrega estimada, presupuesto, notas.
- **Tareas** por proyecto, con checkbox de hecho/pendiente.
- **Proveedores** por proyecto, con contacto.
- Filtro rápido por fase.
- Exportar/importar copia de seguridad en `.json`.

## Desarrollo local

Necesitas [Node.js](https://nodejs.org) instalado (versión 18 o superior).

```bash
npm install
npm run dev
```

Abre la URL que te indique la terminal (normalmente `http://localhost:5173`).

## Subir a GitHub y publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (puede ser privado o público).
2. Desde esta carpeta:

   ```bash
   git init
   git add .
   git commit -m "Primera versión del panel de proyectos"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
   git push -u origin main
   ```

3. En GitHub, ve a **Settings → Pages** de tu repositorio y en "Build and deployment" selecciona **Source: GitHub Actions**.
4. El workflow incluido (`.github/workflows/deploy.yml`) se ejecutará automáticamente en cada `push` a `main` y publicará la app. Al cabo de 1-2 minutos, tu app estará en:

   ```
   https://TU-USUARIO.github.io/TU-REPO/
   ```

No hace falta tocar ningún archivo de configuración: `vite.config.js` ya usa rutas relativas para que funcione en esa URL con subcarpeta.

## Notas

- No he podido probarlo en un navegador real (Safari/Chrome/Firefox) dentro de este entorno; sí he verificado que el proyecto compila sin errores (`npm run build`). Conviene que hagas una prueba rápida en local antes de darlo por bueno para uso diario.
- Si un proyecto lleva mucho tiempo sin actividad y quieres marcarlo como cerrado sin borrarlo, puedes simplemente dejarlo en fase "Entrega".
