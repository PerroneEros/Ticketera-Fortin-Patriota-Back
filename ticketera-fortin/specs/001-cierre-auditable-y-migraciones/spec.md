# Spec 001 — Cierre de caja auditable, historial liviano y actualización segura de la base

> Estado: APROBADA v3 (2026-10-20). Origen: hallazgos #10, #14 y #5 de
> `docs/auditoria-2026-10-20.md`. v2 incorpora las respuestas de clarificación del 2026-10-20.

## Contexto y objetivo
Hoy el cierre de caja guarda un único número (efectivo + transferencias sumados): el esperado por
medio de pago y la diferencia del arqueo solo se ven en pantalla mientras el modal está abierto y
se pierden al cerrar. Eso impide cumplir la métrica "cierre de caja sin diferencias" y la
trazabilidad que exige la constitución (principio 4): después del evento nadie puede saber si
faltó efectivo o si una transferencia no llegó. Además, el dashboard trae todo el historial con
un registro por unidad vendida, lo que con más de 1000 ventas por evento lo vuelve lento en las
PCs de 4 GB de la caja, y los montos de los movimientos admiten decimales, en contra del
principio 5. Resolver estos tres puntos obliga a cambiar la estructura de bases que ya están
instaladas en otras PCs con datos reales, por lo que esta spec también exige que la app actualice
su base sin perder nada y con una copia previa para poder volver atrás (principio 6).

## Usuarios / actores
- Cajero: cierra la caja y carga lo contado.
- Encargado/responsable: consulta el historial, el resumen y los cierres anteriores.
- Equipo de desarrollo: instala versiones nuevas sobre bases existentes.

## Historias de usuario
- H1: Como encargado quiero ver, para cada caja cerrada, cuánto se esperaba, cuánto se contó y la
  diferencia en efectivo y en transferencias por separado, para detectar faltantes después del
  evento.
- H2: Como cajero quiero que el esperado lo calcule el sistema con los registros de la caja y que
  me avise si lo que conté no coincide, para revisar antes de cerrar.
- H3: Como encargado quiero que el historial y el resumen abran sin demora aunque haya miles de
  ventas acumuladas, para consultarlos durante el evento.
- H4: Como equipo de desarrollo quiero que una versión nueva actualice la base de una caja ya
  instalada sin perder datos y con copia previa, para instalar sin miedo donde hay datos reales.

## Requisitos funcionales (criterios de aceptación en EARS)

### A. Cierre de caja auditable (hallazgo #10)
- RF-1: CUANDO el cajero abre el cierre de caja, EL SISTEMA mostrará el efectivo esperado
  calculado por el sistema a partir de los registros de esa caja.
- RF-2: CUANDO el cajero abre el cierre de caja, EL SISTEMA mostrará las transferencias esperadas
  calculadas por el sistema a partir de los registros de esa caja.
- RF-3: EL SISTEMA calculará el efectivo esperado como monto de apertura + efectivo cobrado en
  ventas + ingresos en efectivo − egresos en efectivo de esa caja.
- RF-4: EL SISTEMA calculará las transferencias esperadas como transferencias cobradas en ventas
  + ingresos por transferencia − egresos por transferencia de esa caja.
- RF-5: SI el esperado de un medio de pago resulta negativo, ENTONCES EL SISTEMA lo mostrará y lo
  registrará como negativo sin impedir el cierre.
- RF-6: SI el monto contado de un medio de pago difiere del esperado, ENTONCES EL SISTEMA pedirá
  al cajero que vuelva a confirmar ese monto antes de habilitar el cierre.
- RF-7: SI después de reconfirmar sigue habiendo diferencia, ENTONCES EL SISTEMA mostrará un aviso
  con el monto de la diferencia de cada medio y permitirá cerrar la caja.
- RF-8: CUANDO el cajero confirma el cierre, EL SISTEMA registrará el efectivo contado y las
  transferencias contadas como dos valores separados.
- RF-9: CUANDO el cajero confirma el cierre, EL SISTEMA registrará el efectivo esperado y las
  transferencias esperadas recalculados en ese momento por el sistema.
- RF-10: EL SISTEMA ignorará cualquier valor esperado o diferencia que envíe la pantalla y usará
  solo los que calcule él mismo.
- RF-11: EL SISTEMA mostrará la diferencia de cada medio de pago como contado − esperado, y la
  diferencia total como la suma de ambas.
- RF-12: SI el esperado recalculado al confirmar difiere del que se mostró al cajero, ENTONCES EL
  SISTEMA no cerrará la caja y mostrará los valores actualizados para que el cajero vuelva a
  confirmar.
- RF-13: SI algún monto contado es negativo o tiene decimales, ENTONCES EL SISTEMA rechazará el
  cierre e informará el campo inválido en español.
- RF-14: SI la caja ya está cerrada, ENTONCES EL SISTEMA rechazará un nuevo cierre sin modificar
  los valores registrados.
- RF-15: MIENTRAS una caja esté cerrada, EL SISTEMA no permitirá modificar sus valores de
  contado, esperado ni fecha de cierre.
- RF-16: CUANDO el encargado consulta una caja cerrada en el historial, EL SISTEMA mostrará
  esperado, contado y diferencia de efectivo y de transferencias.
- RF-17: SI la caja se cerró con una versión anterior que no guardaba el desglose, ENTONCES EL
  SISTEMA mostrará el total contado registrado y la indicación "Cierre sin desglose (versión
  anterior)".

### B. Historial y resumen livianos (hallazgo #14)
- RF-18: CUANDO el encargado consulta el resumen de un rango de fechas, EL SISTEMA mostrará los
  totales calculados por el sistema sin descargar a la pantalla el detalle de cada venta del
  rango.
- RF-19: EL SISTEMA mostrará en el resumen los mismos totales (ventas por medio de pago,
  movimientos, unidades por producto y aperturas sumadas a los ingresos) que la versión actual
  para el mismo rango y los mismos datos.
- RF-20: CUANDO el encargado expande una caja en el historial, EL SISTEMA cargará el detalle de
  ventas y movimientos de esa caja.
- RF-21: MIENTRAS una caja del historial esté contraída, EL SISTEMA no cargará el detalle de sus
  ventas.
- RF-22: SI el rango consultado no tiene ventas, movimientos ni cajas, ENTONCES EL SISTEMA
  mostrará totales en cero y el mensaje "Sin movimientos en el período".
- RF-23: SI falla la carga del detalle de una caja, ENTONCES EL SISTEMA mostrará un error en
  español en esa caja y permitirá reintentar sin recargar el resto del historial.

### C. Montos enteros en movimientos (hallazgo #5)
- RF-24: EL SISTEMA guardará el monto de cada movimiento de caja como pesos enteros.
- RF-25: SI un movimiento existente tiene centavos al actualizar la base, ENTONCES EL SISTEMA
  redondeará su monto al peso más cercano (0,50 hacia arriba).
- RF-26: CUANDO redondea un movimiento al actualizar, EL SISTEMA dejará constancia en el reporte
  de actualización del movimiento, su monto original y su monto redondeado.

### D. Actualización segura de la base
- RF-27: CUANDO la app arranca sobre una base de una versión anterior, EL SISTEMA la actualizará a
  la versión actual antes de mostrar la pantalla de venta.
- RF-28: CUANDO la app arranca sin base, EL SISTEMA creará la base directamente en la versión
  actual.
- RF-29: EL SISTEMA conservará al actualizar todas las ventas, ítems de venta, movimientos,
  cajas, productos y categorías existentes, con sus montos y fechas sin cambios salvo lo indicado
  en RF-25.
- RF-30: SI encuentra registros inconsistentes al actualizar (p. ej. un movimiento o una venta
  que apunta a una caja inexistente), ENTONCES EL SISTEMA los conservará sin modificarlos y los
  listará en el reporte de actualización.
- RF-31: CUANDO termina una actualización con redondeos o inconsistencias, EL SISTEMA mostrará un
  aviso en español indicando cuántos registros se redondearon o reportaron y dónde está el
  reporte.
- RF-32: CUANDO va a aplicar una actualización de la base, EL SISTEMA guardará antes una copia
  completa de la base en una carpeta local.
- RF-33: SI no se pudo guardar la copia previa, ENTONCES EL SISTEMA no actualizará la base,
  informará el motivo en español y no abrirá la pantalla de venta.
- RF-34: SI una actualización se interrumpe o falla a mitad de camino (incluido un corte de luz),
  ENTONCES EL SISTEMA dejará la base exactamente como estaba antes de empezar.
- RF-35: SI una actualización falla, ENTONCES EL SISTEMA informará en español que la base no se
  actualizó, indicará dónde está la copia previa y no abrirá la pantalla de venta.
- RF-36: CUANDO la app arranca después de una actualización interrumpida, EL SISTEMA volverá a
  intentarla desde el principio, con una copia previa nueva.
- RF-37: EL SISTEMA registrará en la propia base qué actualizaciones ya se aplicaron y cuándo.
- RF-38: EL SISTEMA no volverá a aplicar una actualización ya registrada como aplicada.
- RF-39: SI al actualizar hay una caja abierta, ENTONCES EL SISTEMA la conservará abierta con sus
  ventas y movimientos, y su cierre seguirá RF-1 a RF-15.
- RF-40: EL SISTEMA conservará en una carpeta dentro de los datos de la app las últimas 5 copias
  previas a una actualización.
- RF-41: CUANDO guarda una copia previa y ya hay 5, EL SISTEMA borrará solo la copia más antigua,
  y únicamente después de haber guardado la nueva sin errores.

## Requisitos no funcionales
- Offline: nada de lo anterior requiere red (constitución, principio 2).
- Montos: todos los valores de cierre, esperados, contados y diferencias en pesos enteros.
- Rendimiento del historial: con una base de 20.000 ventas y 200 cajas, el resumen de "todo el
  tiempo" se muestra en menos de 2 s y el detalle de una caja de 1.500 ventas en menos de 1 s, en
  una PC de 4 GB de RAM.
- Rendimiento de la actualización: sobre una base con datos de una versión anterior, la
  actualización termina en menos de 30 s en una PC de 4 GB.
- La venta en caja (confirmar cobro → imprimir) sigue por debajo de 10 s después de la
  actualización.
- Plataformas: Windows 10/11 x64 e ia32.
- Mensajes al usuario en español.

## Casos límite
- Caja abierta al momento de instalar la versión nueva (RF-39).
- Caja sin ventas ni movimientos: esperado efectivo = apertura, esperado transferencias = 0.
- Egresos mayores que lo cobrado: esperado negativo (RF-5).
- Contado distinto del esperado (RF-6, RF-7).
- Cajas cerradas con la versión anterior, sin desglose (RF-17).
- Movimientos existentes con centavos (RF-25, RF-26).
- Registros inconsistentes de versiones viejas (RF-30).
- Corte de luz durante la actualización (RF-34, RF-36).
- Disco lleno o carpeta sin permisos al hacer la copia previa (RF-33).
- Dos cierres enviados casi a la vez (doble clic) sobre la misma caja (RF-14).
- Volver a una versión anterior: no está soportado instalando solo la versión vieja sobre la base
  actualizada; volver atrás es restaurar la copia previa e instalar la versión anterior. La app no
  detecta ni avisa este caso (decisión del 2026-10-20).

## Fuera de alcance
- Cambios en el PDF de cierre de caja: queda como está hoy (Ingresos / Egresos / Balance en caja
  por medio de pago y Productos vendidos).
- Guardado automático de PDFs y backups al cerrar caja, y exportación a pendrive (backlog ítem 8,
  spec propia). Esta spec solo cubre la copia previa a una actualización de la base.
- Reabrir, corregir o anular un cierre de caja.
- Contraseña de administrador y cambio de método de pago (backlog ítems 4 y 6).
- Detectar o avisar que existen versiones nuevas de la app.
- Eliminar columnas sin uso (p. ej. `printed`) o cualquier otra limpieza de esquema no listada.
- Cambios en el formato del ticket impreso o en la impresión tras un corte de luz.
- Exportar el historial a CSV/Excel u otros reportes nuevos.
- Rehacer el diseño visual del dashboard más allá de lo necesario para RF-16 y RF-20 a RF-23.

## Criterios de finalización
- Cada RF tiene al menos un test automatizado (Vitest) en verde; la validación recorre la spec RF
  por RF.
- La actualización se probó sobre una copia de la base de prueba del equipo (creada por la
  versión anterior), complementada si hace falta con casos que no tenga (caja abierta, movimientos
  con centavos, registros inconsistentes): mismas cantidades de ventas, ítems, movimientos y cajas
  antes y después, y los totales por caja coinciden. La base original nunca se modifica en las
  pruebas.
- Se probó volver atrás: restaurar la copia previa y abrir la base con la versión anterior.
- Demo manual en la app: abrir caja, vender en efectivo, transferencia y combinado, registrar un
  ingreso y un egreso, cerrar con diferencia (reconfirmación y aviso), ver el cierre en el
  historial.
- `npm run lint`, `npm run typecheck` y `npm test` pasan.

## Decisiones de clarificación (2026-10-20)
- Cajas cerradas con la versión anterior: se dejan como están ("sin desglose", RF-17); no se
  calcula su esperado retroactivamente.
- Copias previas: últimas 5 (RF-40, RF-41).
- Pruebas de la actualización: sobre una copia de la base de prueba del equipo. Se aparta del
  principio 6 de la constitución ("copia de una base real"): requiere ajustar ese principio.

## Dudas abiertas
Ninguna.
