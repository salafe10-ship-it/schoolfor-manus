import { useState } from 'react';

export function useStudentTimeline() {
  // Student Lifecycle Form States
  const [lifecycleTransferClass, setLifecycleTransferClass] = useState('');
  const [lifecycleTransferSection, setLifecycleTransferSection] = useState('أ');
  const [lifecycleTransferStage, setLifecycleTransferStage] = useState('');
  const [lifecycleTransferBranch, setLifecycleTransferBranch] = useState('branch_1');

  const [lifecyclePromoteClass, setLifecyclePromoteClass] = useState('');
  const [lifecyclePromoteStage, setLifecyclePromoteStage] = useState('');
  const [lifecyclePromoteFees, setLifecyclePromoteFees] = useState(0);

  const [lifecycleReEnrollClass, setLifecycleReEnrollClass] = useState('');
  const [lifecycleReEnrollSection, setLifecycleReEnrollSection] = useState('أ');

  const [lifecycleDismissType, setLifecycleDismissType] = useState<'temporary' | 'permanent'>('temporary');
  const [lifecycleDismissReason, setLifecycleDismissReason] = useState('');
  const [lifecycleDismissDecision, setLifecycleDismissDecision] = useState('');
  const [lifecycleDismissAuthority, setLifecycleDismissAuthority] = useState('إدارة التعليم العام');

  // Local Promotion State Variables
  const [promoteGrade, setPromoteGrade] = useState('');
  const [promoteSection, setPromoteSection] = useState('أ');
  const [promoteAcademicYear, setPromoteAcademicYear] = useState('1447-1448 هـ');

  return {
    lifecycleTransferClass,
    setLifecycleTransferClass,
    lifecycleTransferSection,
    setLifecycleTransferSection,
    lifecycleTransferStage,
    setLifecycleTransferStage,
    lifecycleTransferBranch,
    setLifecycleTransferBranch,
    lifecyclePromoteClass,
    setLifecyclePromoteClass,
    lifecyclePromoteStage,
    setLifecyclePromoteStage,
    lifecyclePromoteFees,
    setLifecyclePromoteFees,
    lifecycleReEnrollClass,
    setLifecycleReEnrollClass,
    lifecycleReEnrollSection,
    setLifecycleReEnrollSection,
    lifecycleDismissType,
    setLifecycleDismissType,
    lifecycleDismissReason,
    setLifecycleDismissReason,
    lifecycleDismissDecision,
    setLifecycleDismissDecision,
    lifecycleDismissAuthority,
    setLifecycleDismissAuthority,
    promoteGrade,
    setPromoteGrade,
    promoteSection,
    setPromoteSection,
    promoteAcademicYear,
    setPromoteAcademicYear,
  };
}
