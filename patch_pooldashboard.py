import re

with open('frontend/src/components/PoolDashboard.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add Solvency State
state_old = """  const [activeTab, setActiveTab] = useState<'create' | 'pools'>('pools');"""
state_new = """  const [activeTab, setActiveTab] = useState<'create' | 'pools'>('pools');
  const [solvencyData, setSolvencyData] = useState<Record<string, any>>({});
  const [checkingSolvency, setCheckingSolvency] = useState<Record<string, boolean>>({});

  const handleCheckSolvency = async (pool_id: string) => {
    setCheckingSolvency(prev => ({ ...prev, [pool_id]: true }));
    const data = await genLayer.checkPoolSolvency(pool_id);
    if (data) {
        setSolvencyData(prev => ({ ...prev, [pool_id]: data }));
    }
    setCheckingSolvency(prev => ({ ...prev, [pool_id]: false }));
  };
"""
code = code.replace(state_old, state_new)

# Add button to Pool Card UI
button_old = """                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <span className="block font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase mb-1">Available Liquidity</span>"""
button_new = """                      <div className="flex flex-col gap-2 items-end">
                        <button 
                            onClick={() => handleCheckSolvency(pool.pool_id)}
                            disabled={checkingSolvency[pool.pool_id]}
                            className="font-mono text-[10px] uppercase border border-[var(--border-light)] px-2 py-1 hover:bg-[var(--text-main)] hover:text-[var(--bg-main)] transition-colors"
                        >
                            {checkingSolvency[pool.pool_id] ? 'ANALYZING...' : 'CHECK SOLVENCY'}
                        </button>
                        {solvencyData[pool.pool_id] && (
                            <div className={`font-mono text-[10px] px-2 py-1 uppercase tracking-widest ${
                                solvencyData[pool.pool_id].status === 'SECURE' || solvencyData[pool.pool_id].status === 'PERFECT' ? 'text-green-500 bg-green-500/10' :
                                solvencyData[pool.pool_id].status === 'AT_RISK' ? 'text-yellow-500 bg-yellow-500/10' : 'text-red-500 bg-red-500/10'
                            }`}>
                                HEALTH: {solvencyData[pool.pool_id].health_factor} | {solvencyData[pool.pool_id].status}
                            </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <span className="block font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase mb-1">Available Liquidity</span>"""
code = code.replace(button_old, button_new)

with open('frontend/src/components/PoolDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("PoolDashboard updated!")
