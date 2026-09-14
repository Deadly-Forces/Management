const MockAIProvider = require('./mockProvider');

exports.getAIProvider = (tenantConfig = {}) => {
  // In the future, this reads tenantConfig.aiProvider (e.g. 'openai', 'gemini')
  // For Phase 4, we use the realistic MockProvider.
  return new MockAIProvider();
};