const express = require('express');
const crypto = require('crypto');
const {
  identities,
  assets,
  accessRequests,
  auditLogs
} = require('./db');
const { writeAuditEvent } = require('./audit');
const {
  identityRegistrationSchema,
  assetMintSchema,
  accessRequestSchema,
  accessStatusUpdateSchema,
  validationDetails
} = require('./validation');

const router = express.Router();

function sendValidationError(response, error) {
  return response.status(400).json({
    error: 'Validation failed',
    details: validationDetails(error)
  });
}

function isDuplicateError(error) {
  return error && (error.code === 409 || error.name === 'DuplicateKeyError');
}

router.post('/identity/register', async (request, response) => {
  const { error, value } = identityRegistrationSchema.validate(request.body, { abortEarly: false });
  if (error) return sendValidationError(response, error);

  try {
    const existing = await identities.findOne({ did: value.did });
    if (existing) return response.status(409).json({ error: 'An identity with this DID already exists' });

    const identity = { ...value, createdAt: new Date() };
    await identities.insertOne(identity);
    await writeAuditEvent({
      eventType: 'identity_created',
      entityType: 'identity',
      entityId: value.did,
      details: { userId: value.userId }
    });
    return response.status(201).json(identity);
  } catch (caughtError) {
    console.error('Identity registration failed:', caughtError.message);
    if (isDuplicateError(caughtError)) return response.status(409).json({ error: 'Identity already exists' });
    return response.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/identity/:did', async (request, response) => {
  if (!request.params.did || !request.params.did.trim()) {
    return response.status(400).json({ error: 'Validation failed', details: ['did must not be empty'] });
  }

  try {
    const identity = await identities.findOne({ did: request.params.did });
    if (!identity) return response.status(404).json({ error: 'Identity not found' });
    return response.status(200).json(identity);
  } catch (caughtError) {
    console.error('Identity lookup failed:', caughtError.message);
    return response.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/assets/mint', async (request, response) => {
  const { error, value } = assetMintSchema.validate(request.body, { abortEarly: false });
  if (error) return sendValidationError(response, error);

  try {
    const existing = await assets.findOne({ assetId: value.assetId });
    if (existing) return response.status(409).json({ error: 'An asset with this assetId already exists' });

    const asset = { ...value, mintedAt: new Date() };
    await assets.insertOne(asset);
    await writeAuditEvent({
      eventType: 'asset_minted',
      entityType: 'asset',
      entityId: value.assetId,
      details: { ownerDid: value.ownerDid }
    });
    return response.status(201).json(asset);
  } catch (caughtError) {
    console.error('Asset minting failed:', caughtError.message);
    if (isDuplicateError(caughtError)) return response.status(409).json({ error: 'Asset already exists' });
    return response.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/assets/owner/:did', async (request, response) => {
  if (!request.params.did || !request.params.did.trim()) {
    return response.status(400).json({ error: 'Validation failed', details: ['did must not be empty'] });
  }

  try {
    const ownedAssets = await assets.find({ ownerDid: request.params.did }).toArray();
    return response.status(200).json(ownedAssets);
  } catch (caughtError) {
    console.error('Asset lookup failed:', caughtError.message);
    return response.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/access/request', async (request, response) => {
  const { error, value } = accessRequestSchema.validate(request.body, { abortEarly: false });
  if (error) return sendValidationError(response, error);

  try {
    const accessRequest = {
      requestId: crypto.randomUUID(),
      ...value,
      status: 'pending',
      timestamp: new Date()
    };
    await accessRequests.insertOne(accessRequest);
    await writeAuditEvent({
      eventType: 'access_requested',
      entityType: 'access_request',
      entityId: accessRequest.requestId,
      details: { assetId: value.assetId, requesterDid: value.requesterDid }
    });
    return response.status(201).json(accessRequest);
  } catch (caughtError) {
    console.error('Access request creation failed:', caughtError.message);
    return response.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/access/:requestId', async (request, response) => {
  const { error, value } = accessStatusUpdateSchema.validate(request.body, { abortEarly: false });
  if (error) return sendValidationError(response, error);

  try {
    const existing = await accessRequests.findOne({ requestId: request.params.requestId });
    if (!existing) return response.status(404).json({ error: 'Access request not found' });

    const updatedAt = new Date();
    await accessRequests.updateOne(
      { requestId: request.params.requestId },
      { $set: { status: value.status, updatedAt } }
    );
    const updatedRequest = { ...existing, status: value.status, updatedAt };
    await writeAuditEvent({
      eventType: 'access_status_updated',
      entityType: 'access_request',
      entityId: request.params.requestId,
      details: { status: value.status }
    });
    return response.status(200).json(updatedRequest);
  } catch (caughtError) {
    console.error('Access request update failed:', caughtError.message);
    return response.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/audit/logs', async (request, response) => {
  try {
    const logs = await auditLogs.find({}).sort({ timestamp: -1 }).toArray();
    return response.status(200).json(logs);
  } catch (caughtError) {
    console.error('Audit log lookup failed:', caughtError.message);
    return response.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;