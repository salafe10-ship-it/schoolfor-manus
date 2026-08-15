import { Account } from '../types';
import { SchoolCOATemplate } from './COATemplates';

// Define Template Types
export type COATemplateType = 'school' | 'company';

export const getStandardCOATemplate = (schoolId: string, type: COATemplateType = 'school'): Account[] => {
  if (type === 'school') {
    return SchoolCOATemplate.map(t => ({ ...t, schoolId }));
  }
  
  // Return basic tree for other types
  return [
    { id: 'acc_1', schoolId, code: '1000', name: 'الأصول', nature: 'asset', level: 1, isActive: true, isLeaf: false, balance: 0 },
    { id: 'acc_2', schoolId, code: '2000', name: 'الالتزامات', nature: 'liability', level: 1, isActive: true, isLeaf: false, balance: 0 },
    { id: 'acc_3', schoolId, code: '3000', name: 'حقوق الملكية', nature: 'equity', level: 1, isActive: true, isLeaf: false, balance: 0 },
    { id: 'acc_4', schoolId, code: '4000', name: 'الإيرادات', nature: 'revenue', level: 1, isActive: true, isLeaf: false, balance: 0 },
    { id: 'acc_5', schoolId, code: '5000', name: 'المصروفات', nature: 'expense', level: 1, isActive: true, isLeaf: false, balance: 0 }
  ];
};

export const initializeCOAForSchool = (schoolId: string, template: COATemplateType = 'school') => {
    // Only initialize if not already initialized
    if (!localStorage.getItem(`erp_chart_of_accounts_v2_${schoolId}`)) {
      const coa = getStandardCOATemplate(schoolId, template);
      localStorage.setItem(`erp_chart_of_accounts_v2_${schoolId}`, JSON.stringify(coa));
    }
};
