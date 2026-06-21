import React, { useState } from 'react';
import { useMission } from '../store/MissionContext';
import type { Asset, Constraint, ConstraintType } from '../store/types';
import { formatCoordinate } from '../utils/coordinates';

const generateId = () => Math.random().toString(36).substr(2, 9);

const ConstraintForm: React.FC<{
  assetId: string;
  constraint: Constraint;
  assets: Asset[];
  update: (c: Constraint) => void;
  remove: () => void;
}> = ({ assetId, constraint, assets, update, remove }) => {
  const otherAssets = assets.filter(a => a.id !== assetId);

  return (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      <select 
        value={constraint.type} 
        onChange={e => update({ ...constraint, type: e.target.value as ConstraintType })}
        style={{ width: '120px' }}
      >
        <option value="Direct">Grid Point</option>
        <option value="Bearing">Bearing From</option>
        <option value="Distance">Distance From</option>
        <option value="BearingDistance">Bearing & Dist</option>
      </select>

      {constraint.type === 'Direct' ? (
        <input 
          type="text" 
          placeholder="K5 4:6" 
          value={constraint.gridStr || ''} 
          onChange={e => update({ ...constraint, gridStr: e.target.value })}
          style={{ width: '100px' }}
        />
      ) : (
        <>
          <select 
            value={constraint.referenceAssetId || ''} 
            onChange={e => update({ ...constraint, referenceAssetId: e.target.value })}
            style={{ width: '120px' }}
          >
            <option value="" disabled>-- REF --</option>
            {otherAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          {(constraint.type === 'Bearing' || constraint.type === 'BearingDistance') && (
            <input 
              type="number" 
              placeholder="Deg" 
              value={constraint.bearing ?? ''}
              onChange={e => update({ ...constraint, bearing: parseFloat(e.target.value) })}
              style={{ width: '70px' }}
            />
          )}

          {(constraint.type === 'Distance' || constraint.type === 'BearingDistance') && (
            <input 
              type="number" 
              placeholder="km" 
              step="0.01"
              value={constraint.distance ?? ''}
              onChange={e => update({ ...constraint, distance: parseFloat(e.target.value) })}
              style={{ width: '70px' }}
            />
          )}
        </>
      )}

      <button onClick={remove} style={{ padding: '4px 8px' }}>X</button>
    </div>
  );
};

export const AssetPanel: React.FC = () => {
  const { assets, addAsset, updateAsset, removeAsset } = useMission();
  const [newType, setNewType] = useState<string>('RefPoint');

  const handleAdd = () => {
    let name = '';
    const num = assets.filter(a => a.type === newType).length + 1;
    if (newType === 'Spotter') name = `Spotter#${num}`;
    else if (newType === 'RefPoint') name = `RefPoint#${num}`;
    else if (newType === 'Target') name = `Target#${num}`;
    else if (newType === 'StarShell') name = `StarShell#${num}`;
    else name = `Asset#${num}`;

    addAsset({
      id: generateId(),
      name,
      type: newType as any,
      constraints: []
    });
  };

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <select value={newType} onChange={e => setNewType(e.target.value)} style={{ flexGrow: 1 }}>
          <option value="Spotter">Spotter</option>
          <option value="RefPoint">Reference Point</option>
          <option value="Target">Target</option>
          <option value="StarShell">Star Shell</option>
        </select>
        <button className="primary" onClick={handleAdd}>ADD</button>
      </div>

      <div className="flex-col">
        {assets.map(asset => (
          <div key={asset.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
              <input 
                value={asset.name} 
                onChange={e => updateAsset({ ...asset, name: e.target.value })}
                style={{ width: '150px', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)', padding: '2px 4px' }}
              />
              {asset.type !== 'Gun' && <button onClick={() => removeAsset(asset.id)}>DEL</button>}
            </div>

            <div style={{ marginBottom: '8px' }}>
              {asset.resolvedPoint ? (
                <span className="badge resolved">✓ {formatCoordinate(asset.resolvedPoint)}</span>
              ) : asset.ambiguousPoints ? (
                <div style={{ border: '1px dashed var(--color-accent)', padding: '4px' }}>
                  <span className="text-accent" style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}>AMBIGUOUS (SELECT ONE):</span>
                  {asset.ambiguousPoints.map((pt, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => updateAsset({ ...asset, selectedAmbiguousIndex: idx })}
                      style={{ marginRight: '4px', borderColor: asset.selectedAmbiguousIndex === idx ? 'var(--color-accent)' : undefined }}
                    >
                      {formatCoordinate(pt)}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="badge error">UNRESOLVED</span>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
              {asset.constraints.map(c => (
                <ConstraintForm 
                  key={c.id} 
                  assetId={asset.id} 
                  constraint={c} 
                  assets={assets}
                  update={newC => updateAsset({ ...asset, constraints: asset.constraints.map(x => x.id === c.id ? newC : x) })}
                  remove={() => updateAsset({ ...asset, constraints: asset.constraints.filter(x => x.id !== c.id) })}
                />
              ))}
              <button 
                onClick={() => updateAsset({ ...asset, constraints: [...asset.constraints, { id: generateId(), type: 'Bearing' }] })}
                style={{ width: '100%', marginTop: '4px' }}
              >
                + ADD CONSTRAINT
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
