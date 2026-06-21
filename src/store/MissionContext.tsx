import React, { createContext, useContext, useState, useMemo } from 'react';
import type { Asset } from './types';
import { resolveAssets } from './resolver';

interface MissionContextType {
  assets: Asset[];
  addAsset: (asset: Asset) => void;
  updateAsset: (asset: Asset) => void;
  removeAsset: (id: string) => void;
  gunId: string | null;
  setGunId: (id: string | null) => void;
}

const MissionContext = createContext<MissionContextType | undefined>(undefined);

export const MissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: 'gun-1',
      name: 'My Gun',
      type: 'Gun',
      constraints: []
    }
  ]);
  const [gunId, setGunId] = useState<string | null>('gun-1');

  // Automatically resolve whenever assets change
  const resolvedAssets = useMemo(() => resolveAssets(assets), [assets]);

  const addAsset = (asset: Asset) => setAssets(prev => [...prev, asset]);
  
  const updateAsset = (asset: Asset) => setAssets(prev => prev.map(a => a.id === asset.id ? asset : a));
  
  const removeAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    if (gunId === id) setGunId(null);
  };

  return (
    <MissionContext.Provider value={{
      assets: resolvedAssets,
      addAsset,
      updateAsset,
      removeAsset,
      gunId,
      setGunId
    }}>
      {children}
    </MissionContext.Provider>
  );
};

export const useMission = () => {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error('useMission must be used within a MissionProvider');
  return ctx;
};
