export enum StudentStatus {
  APPLICANT = 'applicant',
  ENROLLED = 'enrolled',
  TRANSFERRED = 'transferred',
  WITHDRAWN = 'withdrawn',
  GRADUATED = 'graduated',
  ARCHIVED = 'archived'
}

export enum LifecycleTransition {
  ADMIT = 'admit',
  TRANSFER = 'transfer',
  WITHDRAW = 'withdraw',
  GRADUATE = 'graduate',
  REACTIVATE = 'reactivate',
  ARCHIVE = 'archive'
}

export const ALLOWED_TRANSITIONS: Record<StudentStatus, LifecycleTransition[]> = {
  [StudentStatus.APPLICANT]: [LifecycleTransition.ADMIT],
  [StudentStatus.ENROLLED]: [LifecycleTransition.TRANSFER, LifecycleTransition.WITHDRAW, LifecycleTransition.GRADUATE, LifecycleTransition.ARCHIVE],
  [StudentStatus.TRANSFERRED]: [LifecycleTransition.REACTIVATE],
  [StudentStatus.WITHDRAWN]: [LifecycleTransition.REACTIVATE, LifecycleTransition.ARCHIVE],
  [StudentStatus.GRADUATED]: [LifecycleTransition.ARCHIVE],
  [StudentStatus.ARCHIVED]: [LifecycleTransition.REACTIVATE]
};
