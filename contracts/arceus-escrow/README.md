# Arceus Soroban escrow — Testnet

Código fuente Rust; SDK fijado a 28.0.0 y Cargo.lock incluido. **17 pruebas de contrato pasaron** en el entorno de desarrollo. No desplegado; no auditado externamente. No usar en Mainnet. El SDK 28 debe ser compatible con el protocolo activo de Testnet al desplegar; si la red no lo admite, espera o solicita una adaptación y nuevas pruebas, no cambies versiones sin probar.

## Reglas
- Un hito por campaña, objetivo fijo, plazo máximo 90 días.
- Propietario crea/cancela; aprobador distinto del propietario y destinatario libera/rechaza.
- Donantes firman depósitos; aportación total no excede objetivo.
- Liberación completa solo al alcanzar objetivo, con firma del aprobador y antes del plazo.
- Cancelación o rechazo permiten devolver a cada donante su aportación completa, una vez.
- Al vencer, cada donante puede reembolsarse aunque nadie cancele; no hay liberación tardía.
- Sin retiros de administrador, actualizaciones de código ni liberaciones parciales.
- Activo inmutable elegido en constructor: usar exclusivamente SAC nativo de XLM verificado en Testnet. El contrato no detecta por sí mismo si el desplegador eligió un token impostor.
- Importes enteros en stroops: 1 XLM = 10,000,000; objetivos/documentos deben expresar la misma unidad.
- Hito subjetivo requiere revisión humana. La firma autoriza liberación; no certifica calidad.

## Compilar y probar en tu equipo
Instala Rust con rustup y Stellar CLI según https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup

```bash
rustup target add wasm32v1-none
cargo test --locked
stellar contract build
```

En el entorno Lovable usa `CARGO_TARGET_DIR=/tmp/arceus-rust-target cargo test --locked` para no incorporar binarios grandes al repositorio. El WASM estará en `target/wasm32v1-none/release/arceus_escrow.wasm` al compilar localmente.

## Deploy — solo Testnet
Desde esta carpeta:
```bash
stellar keys generate arceus-deployer --network testnet --fund
XLM_SAC=$(stellar contract id asset --asset native --network testnet)
stellar contract deploy \
  --wasm target/wasm32v1-none/release/arceus_escrow.wasm \
  --source-account arceus-deployer --network testnet \
  --alias arceus-escrow -- --token "$XLM_SAC"
stellar contract invoke --id arceus-escrow \
  --source-account arceus-deployer --network testnet -- asset
```
Confirma que `asset` coincide con el SAC calculado. La CLI almacena la clave localmente: **no compartas esa clave**. Consulta `stellar contract deploy --help` si tu versión de CLI cambia opciones. La receta no se ejecutó aquí: no se crearon identidades ni transferencias financieras.

## Invocaciones
```bash
stellar contract invoke --id arceus-escrow --source-account OWNER --network testnet -- create --owner OWNER_G_ADDRESS --recipient RECIPIENT_G_ADDRESS --approver APPROVER_G_ADDRESS --target 100000000 --deadline UNIX_SECONDS
stellar contract invoke --id arceus-escrow --source-account DONOR --network testnet -- deposit --id CAMPAIGN_ID --donor DONOR_G_ADDRESS --amount 50000000
stellar contract invoke --id arceus-escrow --source-account APPROVER --network testnet -- release --id CAMPAIGN_ID
stellar contract invoke --id arceus-escrow --source-account OWNER --network testnet -- cancel --id CAMPAIGN_ID
stellar contract invoke --id arceus-escrow --source-account APPROVER --network testnet -- reject --id CAMPAIGN_ID
stellar contract invoke --id arceus-escrow --source-account DONOR --network testnet -- refund --id CAMPAIGN_ID --donor DONOR_G_ADDRESS
```
Nombres OWNER/DONOR/APPROVER son identidades locales de CLI; G_ADDRESS son direcciones públicas reales. No ejecutar todos los comandos seguidos: release/cancel/reject son alternativas terminales.

## Pásame después
ID público C… del contrato, hash de despliegue, dirección SAC devuelta por `asset`, direcciones públicas de propietario/destinatario/aprobador, objetivo, plazo y criterio de aceptación. Adjunta salida de compilación y pruebas sin secretos. Integraremos firma, simulación RPC, depósitos y lecturas solo tras verificar el contrato desplegado y su versión.

## Mantenimiento
Persistent e instance TTL se extienden hasta ~120 días con consultas y operaciones; `keep_alive(id, donor)` renueva una contribución conocida. Guarda IDs y donantes desde eventos y programa mantenimiento antes de archivar. Si archiva, restaura las entradas por herramientas de Stellar antes de operar: `get` no es sustituto de restauración. No enviar tokens directamente a la dirección del contrato: no generan aportaciones y no hay rescate administrativo.

Advertencia de compilación: la API legacy `events.publish` está deprecada en SDK 28, pero las 17 pruebas compilaron y pasaron; migrar eventos tipados requiere repetir pruebas e integración.