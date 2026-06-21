import React, { useState } from 'react';
import { useMission } from '../store/MissionContext';
import { distanceBetween, bearingBetween } from '../utils/geometry';
import { findFiringSolutions } from '../utils/ballistics';

export const ResultPanel: React.FC = () => {
  const { assets, gunId } = useMission();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [checkedTargets, setCheckedTargets] = useState<string[]>([]);

  const gun = assets.find(a => a.id === gunId);

  // Filter for 'Target' type assets that are resolved (and not the gun)
  const validTargets = assets.filter(a => a.id !== gunId && a.type === 'Target' && a.resolvedPoint);

  const handleSelectAll = () => {
    if (checkedTargets.length === validTargets.length) {
      setCheckedTargets([]); // Deselect all
    } else {
      setCheckedTargets(validTargets.map(t => t.id)); // Select all
    }
  };

  const toggleTarget = (id: string) => {
    if (checkedTargets.includes(id)) {
      setCheckedTargets(checkedTargets.filter(tId => tId !== id));
    } else {
      setCheckedTargets([...checkedTargets, id]);
    }
  };

  if (!gun || !gun.resolvedPoint) {
    return <div className="text-accent">Error: Gun position not resolved.</div>;
  }

  const allSelected = validTargets.length > 0 && checkedTargets.length === validTargets.length;

  return (
    <div className="flex-col">
      {/* Target Selection Window */}
      <div style={{ marginBottom: '16px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-panel)' }}>
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', border: 'none', borderBottom: isDropdownOpen ? '1px solid var(--color-border)' : 'none', padding: '8px' }}
        >
          <span>SELECT TARGETS ({checkedTargets.length})</span>
          <span>{isDropdownOpen ? '▲' : '▼'}</span>
        </button>
        
        {isDropdownOpen && (
          <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {validTargets.length === 0 ? (
              <div className="text-dim" style={{ fontSize: '12px' }}>No valid targets available.</div>
            ) : (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderBottom: '1px solid var(--color-grid-minor)', paddingBottom: '4px', marginBottom: '4px' }}>
                  <input type="checkbox" checked={allSelected} onChange={handleSelectAll} style={{ width: 'auto', margin: 0 }} />
                  <strong>SELECT ALL</strong>
                </label>
                {validTargets.map(t => (
                  <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={checkedTargets.includes(t.id)} 
                      onChange={() => toggleTarget(t.id)}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    <span>{t.name}</span>
                  </label>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Firing Solutions */}
      <div className="text-dim" style={{ marginBottom: '8px' }}>FIRING SOLUTIONS</div>
      
      {checkedTargets.length === 0 && (
        <div className="text-dim" style={{ fontSize: '12px' }}>No targets selected.</div>
      )}

      {checkedTargets.map(targetId => {
        const target = validTargets.find(t => t.id === targetId);
        if (!target || !target.resolvedPoint) return null; // Safety check

        const dist = distanceBetween(gun.resolvedPoint!, target.resolvedPoint);
        const bearing = bearingBetween(gun.resolvedPoint!, target.resolvedPoint);
        const solutions = findFiringSolutions(dist);
        
        // Take only the lowest charge (which is the first one in the sorted list)
        const bestSolution = solutions.length > 0 ? solutions[0] : null;

        return (
          <div key={target.id} style={{ border: '1px solid var(--color-border)', backgroundColor: '#000', marginBottom: '12px', padding: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '4px' }}>
              <div>
                <strong className="text-accent" style={{ fontSize: '16px' }}>{target.name}</strong>
                <div className="text-dim" style={{ fontSize: '10px', marginTop: '2px' }}>
                  EXACT: (X: {target.resolvedPoint.x.toFixed(3)}, Y: {target.resolvedPoint.y.toFixed(3)})
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
              <div>
                <span className="text-dim" style={{ fontSize: '10px', display: 'block' }}>BEARING</span>
                <span style={{ fontSize: '18px' }}>{bearing.toFixed(1)}°</span>
              </div>
              <div>
                <span className="text-dim" style={{ fontSize: '10px', display: 'block' }}>DISTANCE</span>
                <span style={{ fontSize: '18px' }}>{dist.toFixed(2)} km</span>
              </div>
            </div>

            {!bestSolution ? (
              <div className="text-accent" style={{ fontSize: '12px', borderTop: '1px dashed var(--color-border)', paddingTop: '8px' }}>
                OUT OF RANGE OR ELEVATION ENVELOPE.
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '16px', borderTop: '1px dashed var(--color-border)', paddingTop: '8px' }}>
                <div>
                  <span className="text-dim" style={{ fontSize: '10px', display: 'block' }}>ELEVATION</span>
                  <span style={{ fontSize: '20px', color: 'var(--color-text-main)', fontWeight: 'bold' }}>{bestSolution.elevation.toFixed(2)}°</span>
                </div>
                <div>
                  <span className="text-dim" style={{ fontSize: '10px', display: 'block' }}>CHARGE</span>
                  <span style={{ fontSize: '20px', color: 'var(--color-text-main)', fontWeight: 'bold' }}>{bestSolution.charge}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
