const crypto = require('crypto');
const { auditLogs } = require('./db');

async function writeAuditEvent({ eventType, entityType, entityId, details = {} }) {
  const audit = {
    auditId: crypto.randomUUID(),
    eventType,
    entityType,
    entityId,
    timestamp: new Date(),
    details
  };

  try {
    await auditLogs.insertOne(audit);
  } catch (error) {
    console.error('Audit log write failed:', error.message);
  }
}

module.exports = { writeAuditEvent };