import type { TenantContext } from '../../../tenant/TenantContext.js';

export const DOCUMENT_CLASSIFICATIONS = [
  'public',
  'internal',
  'confidential',
  'restricted',
  'highly_confidential',
] as const;

export const DOCUMENT_LIFECYCLE_STATUSES = [
  'draft',
  'pending_verification',
  'verified',
  'expired',
  'archived',
] as const;

export const DOCUMENT_VERIFICATION_STATUSES = [
  'not_required',
  'pending',
  'verified',
  'rejected',
  'expired',
] as const;

export type DocumentClassification = typeof DOCUMENT_CLASSIFICATIONS[number];
export type DocumentLifecycleStatus = typeof DOCUMENT_LIFECYCLE_STATUSES[number];
export type DocumentVerificationStatus = typeof DOCUMENT_VERIFICATION_STATUSES[number];

export type StudentDocumentRequestContext = TenantContext & {
  requestId: string;
  correlationId: string;
  ipAddress: string;
  idempotencyKey?: string;
};

export type DocumentCategoryInput = {
  categoryCode: string;
  displayName: string;
  description?: string | null;
  sortOrder?: number;
  status?: 'active' | 'inactive' | 'archived';
  expectedVersion?: number;
};

export type DocumentVersionInput = {
  revisionReason?: string | null;
  originalFileName: string;
  mediaType: string;
  byteSize: number;
  contentHash: string;
};

export type StudentDocumentInput = DocumentVersionInput & {
  categoryId: string;
  documentReference: string;
  title: string;
  description?: string | null;
  classification: DocumentClassification;
  verificationStatus?: DocumentVerificationStatus;
  retentionUntil?: string | null;
  archiveEligibleOn?: string | null;
  legalHold?: boolean;
};

export type DocumentListFilters = {
  studentId?: string;
  search?: string;
  categoryId?: string;
  lifecycleStatus?: DocumentLifecycleStatus;
  verificationStatus?: DocumentVerificationStatus;
  classification?: DocumentClassification;
  retention?: 'due' | 'held' | 'eligible';
  page: number;
  limit: number;
};

export type DocumentDecision = 'verify' | 'reject' | 'expire';

export type DocumentOperationResult = {
  documentId: string;
  documentReference: string;
  versionNumber: number;
  requestId: string;
  correlationId: string;
  idempotent: boolean;
};
