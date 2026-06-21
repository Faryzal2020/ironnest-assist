import React from 'react';
import { useMission } from '../store/MissionContext';
import { distanceBetween, bearingBetween } from '../utils/geometry';
import { findFiringSolutions } from '../utils/ballistics';

export const ResultPanel: React.FC = () => {
  const { assets, targetId, setTargetId, gunId } = useMission();

  const gun = assets.find(a => a.id === gunId);
  const target = assets.find(a => a.id === targetId);

  // Exclude gun from target list
  const validTargets = assets.filter(a => a.id !== gunId && a.resolvedPoint);

  let content = null;

  if (!gun || !gun.resolvedPoint) {
    content = <div className="text-accent">Error: Gun position not resolved.</div>;
  } else if (!target) {
    content = <div className="text-dim">Select a target to compute firing solution.</div>;
  } else if (!target.resolvedPoint) {
    content = <div className="text-accent">Error: Target position not resolved.</div>;
  } else {
    const dist = distanceBetween(gun.resolvedPoint, target.resolvedPoint);
    const bearing = bearingBetween(gun.resolvedPoint, target.resolvedPoint);
    const solutions = findFiringSolutions(dist);

    content = (
      <div className="flex-col">
        <div style={{ padding: '8px', border: '1px solid var(--color-border)', backgroundColor: '#000' }}>
          <div className="text-dim" style={{ fontSize: '10px' }}>
            TARGET: {target.name} <br/>
            EXACT: (X: {target.resolvedPoint.x.toFixed(3)}, Y: {target.resolvedPoint.y.toFixed(3)})
          </div>
          <div style={{ fontSize: '24px', margin: '8px 0' }}>
            BEARING: {bearing.toFixed(1)}°
          </div>
          <div>DISTANCE: {dist.toFixed(2)} km</div>
        </div>

        {solutions.length === 0 ? (
          <div className="text-accent" style={{ marginTop: '16px', border: '1px solid var(--color-accent)', padding: '8px' }}>
            TARGET OUT OF RANGE OR ELEVATION ENVELOPE.
          </div>
        ) : (
          <div style={{ marginTop: '16px' }}>
            <div className="text-dim" style={{ marginBottom: '8px' }}>FIRING SOLUTIONS</div>
            {solutions.map((sol, idx) => (
              <div key={idx} style={{ 
                border: idx === 0 ? '1px solid var(--color-text-main)' : '1px solid var(--color-border)', 
                padding: '8px', 
                marginBottom: '8px',
                backgroundColor: idx === 0 ? '#222' : 'transparent'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong>CHARGE {sol.charge}</strong>
                  {idx === 0 && <span className="text-accent" style={{ fontSize: '10px' }}>RECOMMENDED</span>}
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div>
                    <span className="text-dim" style={{ fontSize: '10px', display: 'block' }}>ELEVATION</span>
                    {sol.elevation.toFixed(2)}°
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-col">
      <div style={{ marginBottom: '16px' }}>
        <label className="text-dim" style={{ display: 'block', marginBottom: '4px' }}>SELECT TARGET</label>
        <select 
          value={targetId || ''} 
          onChange={e => setTargetId(e.target.value)}
        >
          <option value="" disabled>-- SELECT TARGET --</option>
          {validTargets.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
      
      {content}
    </div>
  );
};
