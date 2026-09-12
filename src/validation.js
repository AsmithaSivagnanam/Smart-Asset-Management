const Joi = require('joi');

const nonEmptyString = Joi.string().trim().min(1).required();

const identityRegistrationSchema = Joi.object({
  userId: nonEmptyString,
  did: nonEmptyString,
  name: nonEmptyString,
  email: Joi.string().email().required()
});

const assetMintSchema = Joi.object({
  assetId: nonEmptyString,
  ownerDid: nonEmptyString,
  tokenId: nonEmptyString,
  contractAddress: nonEmptyString,
  metadataUri: nonEmptyString
});

const accessRequestSchema = Joi.object({
  requesterDid: nonEmptyString,
  assetId: nonEmptyString,
  action: nonEmptyString,
  reputationScoreAtRequest: Joi.number().min(0).max(100).required()
});

const accessStatusUpdateSchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'denied', 'revoked').required()
});

function validationDetails(error) {
  return error.details.map((detail) => detail.message);
}

module.exports = {
  identityRegistrationSchema,
  assetMintSchema,
  accessRequestSchema,
  accessStatusUpdateSchema,
  validationDetails
};