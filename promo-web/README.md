# AFUENTETO · Web promocional

Proyecto Vite independiente, sin conexiones a Supabase ni dependencias del código de la app. Se puede mover esta carpeta a otro repositorio.

## Desarrollo

Con Node.js 24:

```sh
npm ci
npm run dev
```

Abrir http://localhost:5174. Para compilar: `npm run build`. Para revisar el resultado: `npm run preview` (puerto 4174).

## Contenido

- `index.html`: Home, textos, enlaces, metadatos y maqueta ilustrativa.
- `src/main.js`: menú móvil y explorador de módulos accesible con teclado.
- `src/style.css`: identidad visual y adaptación a móvil.
- `vite.config.js`: base relativa, puertos y compilación independiente en `dist`.

El botón de acceso enlaza a https://afuenteto.github.io/afuenteto/. Las escenas y datos de la vista previa son ilustrativos, no capturas del producto ni datos reales. No se incluyen precios ni testimonios inventados.

No tiene despliegue automático: el workflow de la app no publica esta carpeta. Hay que elegir un destino separado para publicarla.

## Elegir proyecto en VS Code

Desde la carpeta superior:

- `AFUENTETO.code-workspace`: muestra App y Web promocional como dos raíces con nombres distintos.
- `App.code-workspace`: abre únicamente la aplicación.
- `Web-promocional.code-workspace`: abre únicamente la web promocional.

En VS Code: Archivo → Abrir área de trabajo desde archivo. Después aparecen en Archivo → Abrir recientes. En el área conjunta, Terminal → Ejecutar tarea permite elegir App (5173) o Web (5174). Cada proyecto mantiene sus dependencias, comandos y compilación.

La carpeta `promo-web` se oculta dentro del árbol de la app para no verla duplicada; sigue visible como la segunda raíz del área conjunta. Esta organización no mueve ni cambia la app publicada.

## Identidad de verano

`src/brand.css` reproduce los valores predeterminados de la app: Inter, IBM Plex Mono, amarillo #F2CC32, franja #FFF0A0, títulos #6A4B16 y fondo #F8F6F0. Las fuentes se cargan de Google Fonts igual que en la app, con fuentes de respaldo si no hay conexión.

`public/header-photo.png` es una copia de la imagen pública predeterminada de la cabecera de la app. Las fotos personalizadas de las cuentas no se leen desde esta web. Si se cambia la imagen de marca, se puede reemplazar este archivo.
