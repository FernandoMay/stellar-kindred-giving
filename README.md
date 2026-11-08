# Stellar Kindred Giving

Arceus es una plataforma de apoyo comunitario, distribución de contenido digital, donaciones directas y envío de micro-regalos integrada sobre la blockchain de Stellar, desarrollada por el ecosistema Code Garden Collective.

Su propósito fundamental es descentralizar la monetización de creadores y proyectos de impacto social, aprovechando la infraestructura de baja latencia y reducidas tarifas de red de Stellar.

Arquitectura y Características Principales

MóduloFunción principalImplementación en Stellar
Micro-Regalos y PropinasEnvío inmediato de incentivos a creadores en transmisiones o videosUso de tokens nativos (XLM) o stablecoins (USDC)
Fondo de Apoyo ComunitarioRecaudación transparente para proyectos sociales y de código abiertoEscrow programable mediante contratos inteligentes Soroban
Distribución de ContenidoMonetización de medios y acceso exclusivo a publicacionesVerificación de propiedad mediante firmas criptográficas y NFTs

Flujo de Interacción en la Plataforma

1.Conexión de Billetera Sovereign:Red Stellar Mainnet / Testnet.

El usuario o creador conecta su billetera compatible con Stellar (como Freighter o Albedo) para gestionar sus claves públicas sin intermediarios.

2.Publicación y Configuración de Regalos:

Los creadores definen las metas de recaudación o los tipos de regalos digitales (tipping tiers) asociados a sus contenidos y comunidades.

3.Transferencia Directa P2P:

Los simpatizantes envían donaciones o regalos. Las transacciones se liquidan en la red Stellar en un rango de 3 a 5 segundos con comisiones insignificantes.

4.Validación y Liberación en Soroban:

Para causas comunitarias o hitos de entrega, los fondos se resguardan en contratos de Soroban y se liberan automáticamente al cumplir las condiciones prefijadas.

Crear la app web de Arceus con conexión de billetera Stellar, perfiles de creadores y envío de micro-regalos. promociones para empresas y premios para ahcakthones y demas pls

Red Stellar: Testnet

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://stellar-kindred-giving.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dd4caec5-1e3e-4412-9756-b71fa10b2e03).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
