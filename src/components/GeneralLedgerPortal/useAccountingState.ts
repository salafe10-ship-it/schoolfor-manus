import { useState } from 'react';

export const useAccountingState = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('dashboard');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [jvSearchFilters, setJvSearchFilters] = useState<any>({});
  const [activeJvState, setActiveJvState] = useState<any>(null);
  const [showJvSearchOverlay, setShowJvSearchOverlay] = useState<boolean>(false);
  const [showJvPrintModal, setShowJvPrintModal] = useState<boolean>(false);
  const [selectedJvPrintTemplate, setSelectedJvPrintTemplate] = useState<string | null>(null);
  const [drillDownStack, setDrillDownStack] = useState<any[]>([]);
  const [selectedReceiptVoucher, setSelectedReceiptVoucher] = useState<any | null>(null);
  const [showReceiptDetailModal, setShowReceiptDetailModal] = useState<boolean>(false);
  const [selectedPaymentVoucher, setSelectedPaymentVoucher] = useState<any | null>(null);
  const [showPaymentDetailModal, setShowPaymentDetailModal] = useState<boolean>(false);
  // ... add ALL other states here ...
  return {
    activeTab, setActiveTab,
    activeSidebarItem, setActiveSidebarItem,
    refreshing, setRefreshing,
    selectedReport, setSelectedReport,
    jvSearchFilters, setJvSearchFilters,
    activeJvState, setActiveJvState,
    showJvSearchOverlay, setShowJvSearchOverlay,
    showJvPrintModal, setShowJvPrintModal,
    selectedJvPrintTemplate, setSelectedJvPrintTemplate,
    drillDownStack, setDrillDownStack,
    selectedReceiptVoucher, setSelectedReceiptVoucher,
    showReceiptDetailModal, setShowReceiptDetailModal,
    selectedPaymentVoucher, setSelectedPaymentVoucher,
    showPaymentDetailModal, setShowPaymentDetailModal,
  };
};
