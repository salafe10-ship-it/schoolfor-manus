/**
 * Enterprise Search Framework
 */

export interface SearchResult {
  id: string;
  title: string;
  module: string;
  relevance: number;
}

export interface SearchQuery {
  term: string;
  tenantId: string;
  schoolId: string;
  branchId: string;
  academicYearId: string;
}
