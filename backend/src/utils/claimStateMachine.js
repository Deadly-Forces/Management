const validTransitions = {
  'DRAFT': ['SUBMITTED'],
  'SUBMITTED': ['DOCUMENTS_PROCESSING'],
  'DOCUMENTS_PROCESSING': ['READY_FOR_HUMAN_REVIEW', 'ACTION_REQUIRED'],
  'ACTION_REQUIRED': ['SUBMITTED'],
  'READY_FOR_HUMAN_REVIEW': ['UNDER_HUMAN_REVIEW'],
  'UNDER_HUMAN_REVIEW': ['VERIFIED', 'ADDITIONAL_INFO_REQUESTED'],
  'ADDITIONAL_INFO_REQUESTED': ['UNDER_HUMAN_REVIEW'],
  'VERIFIED': ['FINAL_DECISION_PENDING'],
  'FINAL_DECISION_PENDING': ['APPROVED', 'REJECTED'],
  'APPROVED': ['CLOSED'],
  'REJECTED': ['CLOSED'],
  'CLOSED': []
};

exports.isValidTransition = (currentStatus, nextStatus) => {
  const allowed = validTransitions[currentStatus];
  return allowed && allowed.includes(nextStatus);
};