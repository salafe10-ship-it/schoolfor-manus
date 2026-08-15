import { BusinessRuleDecision } from '../types/BusinessRuleDecision';

export class BusinessRuleException extends Error {
  public decision: BusinessRuleDecision;

  constructor(decision: BusinessRuleDecision) {
    // Pass the user message or technical message as the main error message
    super(decision.userMessage || decision.technicalMessage);
    this.name = 'BusinessRuleException';
    this.decision = decision;

    // Restore prototype chain
    Object.setPrototypeOf(this, BusinessRuleException.prototype);
  }
}
