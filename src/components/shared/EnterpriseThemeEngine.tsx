/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { EnterpriseThemeMode, EnterpriseThemes, DesignTokens } from './EnterpriseDesignSystem';
import { storageService } from '../../services/storage/StorageService';

interface EnterpriseThemeContextType {
  themeMode: EnterpriseThemeMode;
  setThemeMode: (mode: EnterpriseThemeMode) => void;
  tokens: DesignTokens;
}

const EnterpriseThemeContext = createContext<EnterpriseThemeContextType>({
  themeMode: 'light',
  setThemeMode: () => {},
  tokens: EnterpriseThemes.light,
});

export function EnterpriseThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<EnterpriseThemeMode>(() => {
    return storageService.getItem<EnterpriseThemeMode>('enterprise_theme') || 'light';
  });

  const setThemeMode = (mode: EnterpriseThemeMode) => {
    setThemeModeState(mode);
    storageService.setItem('enterprise_theme', mode);
    
    // Apply DOM classes
    const root = document.documentElement;
    root.classList.remove('dark', 'copper', 'golden');
    if (mode === 'dark') {
      root.classList.add('dark');
    } else if (mode === 'copper') {
      root.classList.add('copper');
    } else if (mode === 'golden') {
      root.classList.add('golden');
    }
  };

  useEffect(() => {
    setThemeMode(themeMode);
  }, []);

  const tokens = EnterpriseThemes[themeMode] || EnterpriseThemes.light;

  return (
    <EnterpriseThemeContext.Provider value={{ themeMode, setThemeMode, tokens }}>
      {children}
    </EnterpriseThemeContext.Provider>
  );
}

export function useEnterpriseTheme() {
  return useContext(EnterpriseThemeContext);
}
