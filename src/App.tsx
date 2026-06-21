import { MissionProvider } from './store/MissionContext';
import { AssetPanel } from './components/AssetPanel';
import { OperationMap } from './components/OperationMap';
import { ResultPanel } from './components/ResultPanel';

function App() {
  return (
    <MissionProvider>
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        
        {/* Left Panel: Assets */}
        <div style={{ width: '350px', minWidth: '350px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">OPERATIONAL ASSETS</div>
          <div className="panel-content" style={{ padding: 0 }}>
            <AssetPanel />
          </div>
        </div>

        {/* Center Panel: Map */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <OperationMap />
        </div>

        {/* Right Panel: Results */}
        <div style={{ width: '300px', minWidth: '300px', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">FIRING SOLUTION</div>
          <div className="panel-content">
            <ResultPanel />
          </div>
        </div>

      </div>
    </MissionProvider>
  );
}

export default App;
