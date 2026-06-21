import React, { useState, useRef } from 'react';
import type { MouseEvent, WheelEvent } from 'react';
import { useMission } from '../store/MissionContext';
import { polarOffset } from '../utils/geometry';
import { formatCoordinate } from '../utils/coordinates';

export const OperationMap: React.FC = () => {
  const { assets } = useMission();
  
  // ViewBox pan/zoom state
  const [viewBox, setViewBox] = useState({ x: -100, y: -100, w: 2200, h: 1200 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const mapX = (x: number) => x * 100;
  const mapY = (y: number) => 1000 - y * 100;

  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    
    // Scale pixel delta to viewBox delta
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = viewBox.w / rect.width;
      const scaleY = viewBox.h / rect.height;
      setViewBox(v => ({ ...v, x: v.x - dx * scaleX, y: v.y - dy * scaleY }));
    }
    
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault(); // Prevent page scroll
    const scale = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox(v => {
      const newW = v.w * scale;
      const newH = v.h * scale;
      // zoom towards center
      const newX = v.x + (v.w - newW) / 2;
      const newY = v.y + (v.h - newH) / 2;
      return { x: newX, y: newY, w: newW, h: newH };
    });
  };

  // Draw grid
  const majorLines = [];
  const minorLines = [];
  
  // Rows (Y)
  for (let i = 0; i <= 10; i++) {
    const y = mapY(i);
    majorLines.push(<line key={`rM${i}`} x1={0} y1={y} x2={2000} y2={y} stroke="var(--color-grid-major)" strokeWidth="2" />);
    if (i < 10) {
      for (let j = 1; j < 10; j++) {
        const subY = mapY(i + j / 10);
        minorLines.push(<line key={`rm${i}-${j}`} x1={0} y1={subY} x2={2000} y2={subY} stroke="var(--color-grid-minor)" strokeWidth="0.5" />);
      }
    }
  }
  
  // Columns (X)
  for (let i = 0; i <= 20; i++) {
    const x = mapX(i);
    majorLines.push(<line key={`cM${i}`} x1={x} y1={0} x2={x} y2={1000} stroke="var(--color-grid-major)" strokeWidth="2" />);
    if (i < 20) {
      for (let j = 1; j < 10; j++) {
        const subX = mapX(i + j / 10);
        minorLines.push(<line key={`cm${i}-${j}`} x1={subX} y1={0} x2={subX} y2={1000} stroke="var(--color-grid-minor)" strokeWidth="0.5" />);
      }
    }
  }

  // Draw constraints (rays and circles)
  const constraintShapes: React.ReactNode[] = [];
  assets.forEach(asset => {
    asset.constraints.forEach(c => {
      if (c.referenceAssetId) {
        const ref = assets.find(a => a.id === c.referenceAssetId);
        if (ref?.resolvedPoint) {
          const origin = ref.resolvedPoint;
          
          if ((c.type === 'Bearing' || c.type === 'BearingDistance') && c.bearing !== undefined) {
            const far = polarOffset(origin, 30, c.bearing); // 30km is far enough
            constraintShapes.push(
              <line 
                key={`${asset.id}-ray-${c.id}`} 
                x1={mapX(origin.x)} y1={mapY(origin.y)} 
                x2={mapX(far.x)} y2={mapY(far.y)} 
                stroke="rgba(255, 255, 255, 0.3)" 
                strokeWidth="1" 
                strokeDasharray="5,5" 
              />
            );
          }

          if ((c.type === 'Distance' || c.type === 'BearingDistance') && c.distance !== undefined) {
            constraintShapes.push(
              <circle 
                key={`${asset.id}-circ-${c.id}`} 
                cx={mapX(origin.x)} cy={mapY(origin.y)} 
                r={c.distance * 100} 
                fill="none"
                stroke="rgba(255, 255, 255, 0.3)" 
                strokeWidth="1" 
                strokeDasharray="5,5" 
              />
            );
          }
        }
      }
    });
  });

  return (
    <div style={{ flexGrow: 1, backgroundColor: '#000', cursor: isDragging ? 'grabbing' : 'grab' }}
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}
         onWheel={handleWheel}
    >
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        style={{ display: 'block' }}
      >
        {/* Grid Background */}
        <rect x="0" y="0" width="2000" height="1000" fill="#000" />
        
        {minorLines}
        {majorLines}

        {/* Labels */}
        {Array.from({length: 20}).map((_, i) => (
          <text key={`Lcol${i}`} x={mapX(i + 0.5)} y={mapY(-0.2)} fill="var(--color-text-dim)" fontSize="20" textAnchor="middle">
            {String.fromCharCode('A'.charCodeAt(0) + i)}
          </text>
        ))}
        {Array.from({length: 10}).map((_, i) => (
          <text key={`Lrow${i}`} x={mapX(-0.2)} y={mapY(i + 0.5)} fill="var(--color-text-dim)" fontSize="20" alignmentBaseline="middle">
            {i + 1}
          </text>
        ))}

        {constraintShapes}

        {/* Resolved Assets */}
        {assets.map(asset => {
          if (!asset.resolvedPoint) return null;
          const x = mapX(asset.resolvedPoint.x);
          const y = mapY(asset.resolvedPoint.y);
          const color = asset.type === 'Target' || asset.type === 'Gun' ? 'var(--color-accent)' : '#fff';
          
          return (
            <g key={asset.id} transform={`translate(${x}, ${y})`}>
              <line x1="-10" y1="0" x2="10" y2="0" stroke={color} strokeWidth="2" />
              <line x1="0" y1="-10" x2="0" y2="10" stroke={color} strokeWidth="2" />
              <circle cx="0" cy="0" r="3" fill={color} />
              <text x="12" y="4" fill={color} fontSize="14" style={{ textShadow: '1px 1px 0 #000' }}>
                {asset.name}
              </text>
              <text x="12" y="18" fill="var(--color-text-dim)" fontSize="10" style={{ textShadow: '1px 1px 0 #000' }}>
                {formatCoordinate(asset.resolvedPoint)}
              </text>
            </g>
          );
        })}

        {/* Ambiguous Candidates */}
        {assets.map(asset => {
          if (asset.resolvedPoint || !asset.ambiguousPoints) return null;
          return asset.ambiguousPoints.map((pt, idx) => (
            <g key={`${asset.id}-amb-${idx}`} transform={`translate(${mapX(pt.x)}, ${mapY(pt.y)})`}>
              <circle cx="0" cy="0" r="5" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="2,2" />
              <text x="8" y="4" fill="var(--color-accent)" fontSize="12">
                ? {asset.name} [{idx}]
              </text>
            </g>
          ));
        })}

      </svg>
    </div>
  );
};
