export enum BusinessRuleSeverity {
  Information = 'Information',
  Warning = 'Warning',
  Error = 'Error',
  Critical = 'Critical'
}

export interface BusinessRuleDecision {
  ruleCode: string;
  ruleName: string;
  decision: 'Allow' | 'Deny';
  severity: BusinessRuleSeverity;
  userMessage: string;
  technicalMessage: string;
  recommendation: string;
  category: string;
  metadata?: Record<string, any>;
}
