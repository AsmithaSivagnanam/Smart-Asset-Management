const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

async function testDatabaseConnection() {
  if (!process.env.ASTRA_DB_API_ENDPOINT || !process.env.ASTRA_DB_APPLICATION_TOKEN) {
    throw new Error('ASTRA_DB_API_ENDPOINT and ASTRA_DB_APPLICATION_TOKEN must be set in .env');
  }

  const { auditLogs } = require('./src/db');
  const auditId = crypto.randomUUID();
  const testRecord = {
    auditId,
    eventType: 'connection_test',
    entityType: 'system',
    entityId: auditId,
    timestamp: new Date(),
    details: { source: 'test_db.js' }
  };

  await auditLogs.insertOne(testRecord);
  const storedRecord = await auditLogs.findOne({ auditId });
  if (!storedRecord) throw new Error('The connection test record could not be read back');
  console.log(`Astra DB connection test succeeded (auditId: ${auditId})`);
}

testDatabaseConnection().catch((error) => {
  console.error('Astra DB connection test failed:', error.message);
  process.exitCode = 1;
});