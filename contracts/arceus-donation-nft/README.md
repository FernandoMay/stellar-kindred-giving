# Arceus — NFTs de donaciones (Stellar Testnet)

## Qué hace
`donate(donor, recipient, amount)` transfiere XLM mediante el contrato Stellar Asset Contract y crea, en la misma operación atómica, un coleccionable individual del donante. Si el pago falla, no se crea el NFT. La billetera del donante debe autorizarlo. No hay claves privadas en la web, emisor privilegiado, custodia, barrido administrativo ni función de emisión sin pago.

Son NFTs conmemorativos **no transferibles**, con ID, propietario, destinatario, importe exacto en stroops y fecha en cadena. Esta implementación mínima no es una interfaz NFT de marketplace: Freighter y marketplaces no necesariamente los mostrarán; la colección de Arceus los lee directamente. No representan derechos de acceso, propiedad intelectual, inversión ni constancia fiscal. El arte mostrado por Arceus es conmemorativo y no se almacena en el contrato.

Las donaciones clásicas anteriores solo son recuerdos verificados: no se convierten en NFTs ni se cobra otra donación para “reclamarlos”. Este contrato no puede certificar un pago externo consultando Horizon. Los depósitos de escrow también son un flujo independiente; aquí la transferencia es directa al destinatario.

## Compilar y probar
Instala Rust con el objetivo `wasm32v1-none` y una versión actual de Stellar CLI compatible con Soroban SDK 28. No compartas semillas ni claves privadas.

```bash
rustup target add wasm32v1-none
export CARGO_TARGET_DIR=/tmp/arceus-nft-target
cargo test --locked
stellar contract build
```

Ejecuta estos comandos desde esta carpeta. El WASM se genera en `$CARGO_TARGET_DIR/wasm32v1-none/release/arceus_donation_nft.wasm`. Se han ejecutado 10 pruebas nativas; no es una auditoría externa y el despliegue real sigue pendiente.

## Desplegar exclusivamente en Testnet
Usa una identidad **local de prueba** configurada en Stellar CLI. Nunca uses Mainnet ni una identidad con fondos reales.

```bash
stellar keys generate arceus-nft-deployer --network testnet --fund
XLM_TOKEN=$(stellar contract id asset --asset native --network testnet)
stellar contract deploy \
  --wasm "$CARGO_TARGET_DIR/wasm32v1-none/release/arceus_donation_nft.wasm" \
  --source arceus-nft-deployer --network testnet \
  -- --token "$XLM_TOKEN"
```

El constructor fija el token para siempre. Antes de conectar la web, se debe comprobar que `token()` coincide con el SAC nativo de **Testnet** y que el código desplegado corresponde a este WASM.

## Probar una donación real
Con una segunda dirección pública Testnet fondeada como destinatario, y `NFT_ID` establecido localmente al ID real devuelto por el despliegue:

```bash
stellar contract invoke --id "$NFT_ID" --source arceus-nft-deployer --network testnet -- \
  donate --donor arceus-nft-deployer --recipient "$DESTINATARIO_TESTNET" --amount 10000000
stellar contract invoke --id "$NFT_ID" --source arceus-nft-deployer --network testnet -- \
  list --owner arceus-nft-deployer --start 0 --limit 13
stellar contract invoke --id "$NFT_ID" --source arceus-nft-deployer --network testnet -- token
```

`10000000` stroops = `1.0000000 XLM`. Repetir `donate` realiza **otro pago**, no es una consulta ni recuperación. Cada firma necesita autorización expresa.

## Qué enviar a Fernando / Arceus para conectarlo
- ID público real del contrato (`C…`).
- Hash de despliegue y red Testnet.
- Resultado público de `token()` y hash SHA-256 del WASM (`sha256sum archivo.wasm`).
- Hash de una donación de prueba y las dos direcciones públicas utilizadas.
- ID y hash de despliegue del escrow, por separado, si quieres conectar custodia.
- Nombres reales de creadores, direcciones públicas y datos reales de empresas/hackathons; no se inventarán registros.

No enviar claves secretas (`S…`), frases de recuperación o archivos de identidad.

## Conexión web y límites
La web tiene el perfil `/perfil`, consulta de propiedad mediante `list`, preparación y firma Freighter de `donate`. El ID permanece sin configurar hasta verificar el despliegue; así no se confunde “listo para conectar” con “conectado”. La emisión real y la prueba completa con billetera están pendientes. El historial clásico solo acepta pagos XLM de una operación, no invocaciones Soroban: los NFTs se leen de su propio contrato.

El almacenamiento de Soroban tiene TTL, no es permanencia infinita. Las lecturas renuevan las entradas consultadas y `keep_alive` renueva la instancia; se debe mantener y restaurar entradas archivadas mediante Stellar CLI cuando corresponda. El lector de Arceus muestra error si la simulación requiere restauración, en vez de mostrar propiedad falsa. Testnet puede resetearse y perder toda la colección.

## Seguridad y pruebas
Diez pruebas cubren pago+NFT atómicos, IDs únicos, autorización del donante, fondos insuficientes sin mint, importes positivos, no autodonación, no envío al contrato, aislamiento de propietarios, ID inexistente y paginación limitada. No hay transferencias, aprobaciones, actualización de metadatos ni emisor: nadie puede mover el recuerdo de su donante. Una donación a cualquier cuenta no prueba impacto social; el NFT solo registra la transferencia autorizada.