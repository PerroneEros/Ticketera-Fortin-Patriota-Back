# Licencias

Cada PC se habilita con una clave que es la firma Ed25519 de su "Código de Equipo".
La app solo contiene la clave **pública** (`src/main/licensePublicKey.ts`): puede verificar
licencias pero no generarlas. La clave **privada** queda únicamente con el encargado.

## Una sola vez: crear el par de claves

```bash
node tools/license/keygen.mjs C:\ruta\segura
```

- Copiá la clave pública que imprime en `src/main/licensePublicKey.ts` y commiteala.
- `private.pem` **nunca** va al repo ni a carpetas compartidas. Hacé un backup offline (pendrive
  guardado): si se pierde, no se pueden emitir más licencias; si se filtra, cualquiera puede.
- Cambiar el par invalida todas las licencias ya emitidas.

## Por cada PC: emitir la licencia

1. En la caja, la pantalla "Sistema Bloqueado" muestra el Código de Equipo. Copialo.
2. Generá la clave:

   ```bash
   node tools/license/generate-license.mjs C:\ruta\segura\private.pem <codigo-de-equipo>
   ```

3. Pegá la clave en la caja y tocá "Activar Sistema".

Si la caja cambia de hardware (disco, placa), el código cambia y hay que repetir el paso 2.
