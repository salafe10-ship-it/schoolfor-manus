import { useState, useMemo } from 'react';
import { Student, School } from '../../../types';
import { StudentSearchEngine } from '../../../utils/StudentSearchEngine';

interface UseStudentSearchProps {
  students: Student[];
  selectedSchool: School;
  itemsPerPage?: number;
}

export function useStudentSearch({
  students,
  selectedSchool,
  itemsPerPage = 8,
}: UseStudentSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Enterprise Extended Multi-criteria Search Fields
  const [filterSection, setFilterSection] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  
  // Advanced Targeted Filters
  const [advancedMode, setAdvancedMode] = useState(false);
  const [targetName, setTargetName] = useState('');
  const [targetNationalId, setTargetNationalId] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  const [targetParentName, setTargetParentName] = useState('');
  const [targetAcademicId, setTargetAcademicId] = useState('');
  const [targetStudentCode, setTargetStudentCode] = useState('');

  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Student | 'guardianName'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Unified Enterprise Search Execution
  const filteredList = useMemo(() => {
    return StudentSearchEngine.search(students, {
      schoolId: selectedSchool.id,
      query: searchQuery,
      stageId: filterStage,
      gradeName: filterGrade,
      section: filterSection,
      status: filterStatus,
      academicYear: filterAcademicYear,
      // Advanced Targeted options
      targetName: advancedMode ? targetName : '',
      targetNationalId: advancedMode ? targetNationalId : '',
      targetPhone: advancedMode ? targetPhone : '',
      targetParentName: advancedMode ? targetParentName : '',
      targetAcademicId: advancedMode ? targetAcademicId : '',
      targetStudentCode: advancedMode ? targetStudentCode : ''
    });
  }, [
    students,
    selectedSchool,
    searchQuery,
    filterStage,
    filterGrade,
    filterSection,
    filterStatus,
    filterAcademicYear,
    advancedMode,
    targetName,
    targetNationalId,
    targetPhone,
    targetParentName,
    targetAcademicId,
    targetStudentCode
  ]);

  // Sorting logic
  const sortedList = useMemo(() => {
    const list = [...filteredList];
    list.sort((a, b) => {
      let valA: any = a[sortField as keyof Student] || '';
      let valB: any = b[sortField as keyof Student] || '';
      
      if (sortField === 'guardianName') {
        valA = a.parentName || '';
        valB = b.parentName || '';
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortDirection === 'asc'
          ? (valA > valB ? 1 : -1)
          : (valB > valA ? 1 : -1);
      }
    });
    return list;
  }, [filteredList, sortField, sortDirection]);

  // Paginated students list
  const totalPages = Math.ceil(sortedList.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedList.slice(start, start + itemsPerPage);
  }, [sortedList, currentPage, itemsPerPage]);

  const toggleSort = (field: keyof Student | 'guardianName') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterStage('');
    setFilterGrade('');
    setFilterStatus('');
    setFilterSection('');
    setFilterAcademicYear('');
    setTargetName('');
    setTargetNationalId('');
    setTargetPhone('');
    setTargetParentName('');
    setTargetAcademicId('');
    setTargetStudentCode('');
    setAdvancedMode(false);
    setCurrentPage(1);
  };

  return {
    searchQuery,
    setSearchQuery,
    filterStage,
    setFilterStage,
    filterGrade,
    setFilterGrade,
    filterStatus,
    setFilterStatus,
    filterSection,
    setFilterSection,
    filterAcademicYear,
    setFilterAcademicYear,
    advancedMode,
    setAdvancedMode,
    targetName,
    setTargetName,
    targetNationalId,
    setTargetNationalId,
    targetPhone,
    setTargetPhone,
    targetParentName,
    setTargetParentName,
    targetAcademicId,
    setTargetAcademicId,
    targetStudentCode,
    setTargetStudentCode,
    selectedIds,
    setSelectedIds,
    currentPage,
    setCurrentPage,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    filteredList,
    sortedList,
    paginatedList,
    totalPages,
    toggleSort,
    resetFilters,
  };
}
