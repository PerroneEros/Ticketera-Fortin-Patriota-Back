# Guía: instalar una versión que actualiza la base

Desde la spec 001 la app actualiza sola la estructura de su base de datos al abrirse
(migraciones). Esta guía es para el equipo que instala la versión nueva en una caja con datos.

Archivos, en la carpeta de datos de la app (`%APPDATA%\ticketera-fortin\`):

- `baseTicketera.sqlite`: la base.
- `copias-actualizacion\pre-vX-a-vY-AAAAMMDD-HHMMSS.sqlite`: copia de la base tal como estaba
  antes de cada actualización. Se guardan las últimas 5.
- `copias-actualizacion\reporte-AAAAMMDD-HHMMSS.txt`: qué se actualizó, qué montos se
  redondearon y qué registros inconsistentes se encontraron (se conservan sin cambios).

## Antes de instalar

1. Instalar **entre eventos**, nunca con un evento en curso. Si hay una caja abierta se conserva
   abierta, pero conviene cerrarla antes.
2. Probar la actualización sobre una copia de la base de esa caja (no la modifica):

   ```powershell
   $env:TICKETERA_DB = "C:\ruta\a\baseTicketera.sqlite"
   npm run db:try-migration
   ```

   Tiene que terminar con `Resultado: sin diferencias`. Si muestra diferencias, **no instalar**.

## Instalar

1. Cerrar la app.
2. Instalar la versión nueva.
3. Abrir la app. La actualización tarda menos de un segundo en una base de un evento.
   - Si hubo montos redondeados o registros inconsistentes aparece el aviso "Base de datos
     actualizada" con la ruta del reporte. Leerlo y guardarlo.
   - Sin hallazgos, la app abre sin avisos.
4. Entrar al dashboard, "Historial", y verificar que las cajas anteriores muestran los mismos
   totales que antes. Las cajas cerradas antes de esta versión dicen "Cierre sin desglose
   (versión anterior)": es lo esperado.

## Si la actualización falla

La base queda exactamente como estaba: la actualización se aplica entera o no se aplica. La app
muestra el motivo y se cierra sin abrir la caja.

- **"No se pudo hacer la copia de seguridad"**: liberar espacio en disco (hace falta al menos el
  tamaño de la base) o revisar permisos de `%APPDATA%\ticketera-fortin`, y volver a abrir.
- **"No se pudo actualizar la base de datos"**: reinstalar la versión anterior (la base sigue en
  su formato viejo) y pasarle al equipo de desarrollo el mensaje y la base.
- **Corte de luz durante la actualización**: al volver a abrir, SQLite deshace lo que quedó a
  medias y la actualización se reintenta desde el principio, con una copia nueva.

## Volver a la versión anterior después de una actualización exitosa

1. Cerrar la app.
2. En `%APPDATA%\ticketera-fortin\`, renombrar `baseTicketera.sqlite` a
   `baseTicketera-actualizada.sqlite` (no borrarla).
3. Copiar el `copias-actualizacion\pre-…sqlite` más reciente como `baseTicketera.sqlite`.
4. Instalar la versión anterior.

Lo vendido después de la actualización queda solo en `baseTicketera-actualizada.sqlite` y
recuperarlo es manual. Por eso el paso 4 de "Instalar" se hace antes del siguiente evento.
