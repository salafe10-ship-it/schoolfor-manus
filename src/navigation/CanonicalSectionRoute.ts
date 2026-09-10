export type PortalScope = 'login' | 'school' | 'admin';

/**
 * Historical section identifiers are accepted only as inbound compatibility
 * aliases. Application state and rendering always use a canonical route.
 */
export function canonicalSectionRoute(sectionId: string, portal: PortalScope): string {
  switch (sectionId) {
    case 'permissions_admin':
      return portal === 'admin' ? 'super_rbac' : 'school_users_admin';
    case 'student_affairs':
      return 'students';
    case 'hr':
      return 'teachers';
    case 'buses':
      return 'school_transport';
    case 'uniform_management':
      return 'school_uniform';
    default:
      return sectionId;
  }
}
