# TrustMesh Backend

Node.js and Express API for decentralized identity, asset ownership, access control, and audit logging. It uses the Astra DB Data API through `@datastax/astra-db-ts`.

## Prerequisites

- Node.js 18 or newer
- An Astra DB database with the `identities`, `assets`, `access`, and `logs` collections
- An Astra DB API endpoint and application token

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env`, then put your Astra endpoint in `ASTRA_DB_API_ENDPOINT` and application token in `ASTRA_DB_APPLICATION_TOKEN`. Set `PORT` if needed; it defaults to `3001`.

Never commit `.env` or expose the application token.

## Run

Test the database connection and audit collection:

```bash
npm run test:db
```

Run the development server:

```bash
npm run dev
```

The server URL is `http://localhost:3001`.

## Endpoints

- `GET /health` returns the service health status.
- `POST /api/identity/register` validates and creates an identity; duplicate DIDs return `409`.
- `GET /api/identity/:did` retrieves an identity by DID.
- `POST /api/assets/mint` validates and creates an asset; duplicate asset IDs return `409`.
- `GET /api/assets/owner/:did` lists assets owned by a DID.
- `POST /api/access/request` creates a pending access request.
- `PATCH /api/access/:requestId` changes a request status to `pending`, `approved`, `denied`, or `revoked`.
- `GET /api/audit/logs` lists audit events newest first.

## Curl examples

```bash
curl http://localhost:3001/health

curl -X POST http://localhost:3001/api/identity/register -H "Content-Type: application/json" -d "{\"userId\":\"user-123\",\"did\":\"did:example:123\",\"name\":\"Alice\",\"email\":\"alice@example.com\"}"

curl http://localhost:3001/api/identity/did:example:123

curl -X POST http://localhost:3001/api/assets/mint -H "Content-Type: application/json" -d "{\"assetId\":\"asset-123\",\"ownerDid\":\"did:example:123\",\"tokenId\":\"1\",\"contractAddress\":\"0x123\",\"metadataUri\":\"ipfs://example\"}"

curl http://localhost:3001/api/assets/owner/did:example:123

curl -X POST http://localhost:3001/api/access/request -H "Content-Type: application/json" -d "{\"requesterDid\":\"did:example:456\",\"assetId\":\"asset-123\",\"action\":\"view\",\"reputationScoreAtRequest\":87}"

curl -X PATCH http://localhost:3001/api/access/REQUEST_ID -H "Content-Type: application/json" -d "{\"status\":\"approved\"}"

curl http://localhost:3001/api/audit/logs
```