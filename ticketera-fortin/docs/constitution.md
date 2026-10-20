# Constitución — Ticketera Fortín
1. Stack fijo: Electron + React + Express + SQLite/Sequelize + zod. Sin dependencias nuevas sin justificar; las nativas deben compilar para Electron en Windows x64 e ia32.
2. Offline siempre: ninguna funcionalidad puede requerir red ni internet.
3. Ninguna venta confirmada se pierde: se persiste en la base antes de imprimir.
4. Trazabilidad: toda acción que afecte dinero (venta, movimiento, cambio de método de pago, apertura/cierre) queda registrada y nunca se borra físicamente.
5. Montos en pesos enteros (INTEGER). Nada de floats para dinero.
6. Todo cambio de modelo trae una migración probada sobre una copia de una base real. Nunca depender solo de `sequelize.sync()`.
7. Toda entrada a la API se valida con zod y las acciones sensibles exigen contraseña de administrador validada en el main, no solo en la UI.
8. Cada arreglo o feature trae tests con Vitest; lint, typecheck y tests pasan antes de cada PR. Lo que toque impresión se prueba con la impresora real.
