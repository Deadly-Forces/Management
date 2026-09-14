class MockAIProvider {
  async analyzeDocumentQuality(fileUrl) {
    return {
      result: 'USABLE',
      confidence: 98.5,
      detectedIssue: null,
      recommendedAction: 'Proceed to classification'
    };
  }

  async classifyDocument(fileUrl) {
    const isLife = fileUrl.includes('death_cert');
    return {
      result: isLife ? 'OFFICIAL_DEATH_CERTIFICATE' : 'AUTO_REPAIR_ESTIMATE',
      confidence: 99.2,
      detectedIssue: null,
      recommendedAction: 'Proceed to text extraction'
    };
  }

  async extractText(fileUrl) {
    return {
      result: 'MOCK_RAW_OCR_TEXT_BLOCK...',
      confidence: 95.0,
      detectedIssue: null,
      recommendedAction: 'Proceed to structured extraction'
    };
  }

  async extractStructuredFields(ocrText, docType) {
    if (docType === 'OFFICIAL_DEATH_CERTIFICATE') {
      return [
        { fieldCategory: 'Beneficiary', description: 'Primary Beneficiary', value: 'Jane Ford', confidence: 99.8, evidenceLocation: 'Page 1, Box 14a' },
        { fieldCategory: 'VitalCheck', description: 'Cause of Death', value: 'Natural', confidence: 95.0, evidenceLocation: 'Page 1, Box 32' }
      ];
    } else {
      return [
        { fieldCategory: 'LineItem', description: 'Front Bumper OEM', value: 850.00, confidence: 92.4, evidenceLocation: 'Page 1, Row 4' },
        { fieldCategory: 'LineItem', description: 'Labor (4.5 hrs)', value: 405.00, confidence: 98.1, evidenceLocation: 'Page 1, Row 5' },
        { fieldCategory: 'LineItem', description: 'Paint & Supplies', value: 150.00, confidence: 85.0, evidenceLocation: 'Page 2, Row 1' }
      ];
    }
  }

  async analyzeConsistency(extractions, claimData) {
    return {
      result: 'CONSISTENT',
      confidence: 94.0, // consistencyScore
      detectedIssue: null,
      recommendedAction: 'Route to Adjuster Queue'
    };
  }

  async generateSummary(extractions, claimData) {
    return {
      result: `AI processed ${extractions.length} key data points. Documents align with standard parameters. No major anomalies detected.`,
      confidence: 90.0,
      detectedIssue: null,
      recommendedAction: 'Requires Human Verification'
    };
  }
}

module.exports = MockAIProvider;