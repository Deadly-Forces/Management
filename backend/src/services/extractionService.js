/**
 * Entity Extraction Service
 * Uses a Regex and Contextual Rule Engine to extract key insurance fields
 * from raw OCR text: Policy Number, Dates, Currency Amounts, and Names.
 */

/**
 * Extracts structured entities from raw document text.
 * 
 * @param {string} rawText - Unstructured text from OCR
 * @returns {object} Structured entities and field extractions
 */
exports.extractEntities = (rawText = '') => {
  if (!rawText || typeof rawText !== 'string') {
    return {
      policyNumber: null,
      dateOfIncident: null,
      allDates: [],
      estimatedAmount: null,
      currency: 'INR',
      claimantName: null,
      beneficiaryName: null,
      rawFields: []
    };
  }

  const cleanText = rawText.replace(/\r\n/g, '\n');
  const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Policy Number: pattern [A-Z]{2,4}-\d{6,10} or variations like Document #: \d+ or POL-\d+
  let policyNumber = null;
  const policyRegex = /\b([A-Z]{2,4}-\d{6,10})\b/i;
  const policyMatch = cleanText.match(policyRegex);
  if (policyMatch) {
    policyNumber = policyMatch[1].toUpperCase();
  } else {
    // Fallback: Check for "Policy No", "Policy Number", "Document #"
    const fallbackPolicy = /(?:policy\s*(?:no|number|#)?[:.\s]*|document\s*#[:.\s]*)([A-Z0-9-]{6,16})/i;
    const match = cleanText.match(fallbackPolicy);
    if (match) {
      policyNumber = match[1].trim().toUpperCase();
    }
  }

  // 2. Dates: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, or MM:DD:YYYY (common OCR colon artifact)
  const dateRegex = /\b(\d{1,2}[/:.-]\d{1,2}[/:.-]\d{2,4}|\d{4}[/:.-]\d{1,2}[/:.-]\d{1,2})\b/g;
  const dateMatches = (cleanText.match(dateRegex) || []).map(d => d.replace(/:/g, '/'));
  const uniqueDates = Array.from(new Set(dateMatches));
  
  // Incident or loss date context match
  let dateOfIncident = null;
  const incidentDateRegex = /(?:date\s+of\s+(?:loss|incident|accident|death)|occurred\s+on)[:\s.]*(\d{1,2}[/:.-]\d{1,2}[/:.-]\d{2,4}|\d{4}[/:.-]\d{1,2}[/:.-]\d{1,2})/i;
  const incidentMatch = cleanText.match(incidentDateRegex);
  if (incidentMatch) {
    dateOfIncident = incidentMatch[1].replace(/:/g, '/');
  } else if (uniqueDates.length > 0) {
    dateOfIncident = uniqueDates[0];
  }

  // 3. Currency Amount: ₹ or INR or Rs or $ followed by digits and optional commas/decimals
  let estimatedAmount = null;
  let currency = 'INR';
  
  const currencyRegex = /(?:₹|INR|Rs\.?|\$)\s*([\d,]+(?:\.\d{2})?)/i;
  const amountMatch = cleanText.match(currencyRegex);
  if (amountMatch) {
    const rawVal = amountMatch[1].replace(/,/g, '');
    estimatedAmount = parseFloat(rawVal);
    if (amountMatch[0].includes('$')) currency = 'USD';
  } else {
    // Fallback search for lines with "Total", "Estimate", "Amount", "Claim Value"
    const totalRegex = /(?:total|estimate|amount|claim\s*value|repair\s*cost)[:\s]+(?:₹|INR|Rs\.?|\$)?\s*([\d,]+(?:\.\d{2})?)/i;
    const totalMatch = cleanText.match(totalRegex);
    if (totalMatch) {
      estimatedAmount = parseFloat(totalMatch[1].replace(/,/g, ''));
    }
  }

  // 4. Names: Name after "Name:", "Insured:", "Beneficiary:", "Claimant:"
  let claimantName = null;
  let beneficiaryName = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check Beneficiary
    if (/(?:beneficiary|nominee|recipient)[:\s]*/i.test(line)) {
      const inlineVal = line.replace(/^(?:beneficiary|nominee|recipient)[:\s]*/i, '').trim();
      if (inlineVal.length > 2 && /^[A-Za-z\s.]+$/.test(inlineVal)) {
        beneficiaryName = inlineVal;
      } else if (i + 1 < lines.length && /^[A-Za-z\s.]+$/.test(lines[i + 1])) {
        beneficiaryName = lines[i + 1].trim();
      }
    }

    // Check Insured / Claimant / Name
    if (/(?:insured|claimant|name\s+of\s+insured|name)[:\s]*/i.test(line)) {
      const inlineVal = line.replace(/^(?:insured|claimant|name\s+of\s+insured|name)[:\s]*/i, '').trim();
      if (inlineVal.length > 2 && /^[A-Za-z\s.]+$/.test(inlineVal) && !inlineVal.toLowerCase().includes('insurance')) {
        if (!claimantName) claimantName = inlineVal;
      } else if (i + 1 < lines.length && /^[A-Za-z\s.]+$/.test(lines[i + 1]) && !lines[i + 1].toLowerCase().includes('insurance')) {
        if (!claimantName) claimantName = lines[i + 1].trim();
      }
    }
  }

  // Clean trailing punctuation
  if (claimantName) claimantName = claimantName.replace(/^[.\s-]+|[.\s-]+$/g, '');
  if (beneficiaryName) beneficiaryName = beneficiaryName.replace(/^[.\s-]+|[.\s-]+$/g, '');

  return {
    policyNumber,
    dateOfIncident,
    allDates: uniqueDates,
    estimatedAmount,
    currency,
    claimantName,
    beneficiaryName,
    rawFields: [
      { field: 'policyNumber', value: policyNumber, confidence: policyNumber ? 96 : 0 },
      { field: 'dateOfIncident', value: dateOfIncident, confidence: dateOfIncident ? 92 : 0 },
      { field: 'estimatedAmount', value: estimatedAmount, confidence: estimatedAmount ? 90 : 0 },
      { field: 'claimantName', value: claimantName, confidence: claimantName ? 88 : 0 },
      { field: 'beneficiaryName', value: beneficiaryName, confidence: beneficiaryName ? 88 : 0 }
    ]
  };
};
