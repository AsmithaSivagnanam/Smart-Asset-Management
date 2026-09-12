const dotenv = require('dotenv');
const { DataAPIClient } = require('@datastax/astra-db-ts');

dotenv.config();

const { ASTRA_DB_API_ENDPOINT: endpoint, ASTRA_DB_APPLICATION_TOKEN: token } = process.env;

if (!endpoint || !token) {
  throw new Error('ASTRA_DB_API_ENDPOINT and ASTRA_DB_APPLICATION_TOKEN must be set');
}

const client = new DataAPIClient(token);
const database = client.db(endpoint);

const identities = database.collection('identities');
const assets = database.collection('assets');
const accessRequests = database.collection('access');
const auditLogs = database.collection('logs');

module.exports = {
  database,
  identities,
  assets,
  accessRequests,
  auditLogs
};