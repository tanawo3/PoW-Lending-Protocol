import React, { useState } from 'react';
import { Shield, Coins, Activity, Users, Settings } from 'lucide-react';
import { useGenLayer } from '../hooks/useGenLayer';
import { toast } from 'sonner';

export const AdminDashboard: React.FC<{ genLayer: any }> = ({ genLayer }) => {
  const { grantRole, revokeRole, withdrawProtocolFees, rebalanceMacroRisk } = genLayer;
  
  const [roleAddress, setRoleAddress] = useState('');
  const [roleName, setRoleName] = useState('AUDITOR');
  const [feeAmount, setFeeAmount] = useState('');

  const handleGrantRole = async () => {
    if (!roleAddress) return toast.error("Enter an address");
    await grantRole(roleAddress, roleName);
  };

  const handleRevokeRole = async () => {
    if (!roleAddress) return toast.error("Enter an address");
    await revokeRole(roleAddress);
  };

  const handleWithdraw = async () => {
    if (!feeAmount) return toast.error("Enter an amount to withdraw");
    await withdrawProtocolFees(BigInt(feeAmount));
  };

  const handleRebalance = async () => {
    await rebalanceMacroRisk();
  };

  return (
    <div className="flex flex-col gap-8 text-white relative z-10 p-6 glass-panel border border-[var(--glass-border)] rounded-xl mt-6">
      <div className="flex items-center gap-3 border-b border-[var(--glass-border)] pb-4">
        <Shield className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-bold font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-600">
          Admin Control Center
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RBAC Management */}
        <div className="bg-black/40 border border-[var(--glass-border)] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-fuchsia-400" />
            <h3 className="text-sm font-semibold font-mono tracking-widest text-[var(--text-muted)] uppercase">Role Based Access Control</h3>
          </div>
          <p className="font-mono text-[10px] text-[var(--text-muted)] mt-1 mb-3 leading-relaxed italic">
            Grant or revoke administrative roles. Roles dictate access to specific protocol functions.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-1 uppercase">Target Address</label>
              <input 
                type="text" 
                value={roleAddress}
                onChange={(e) => setRoleAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-black/60 border border-[var(--glass-border)] rounded px-3 py-2 text-sm font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-1 uppercase">Role Type</label>
              <select 
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full bg-black/60 border border-[var(--glass-border)] rounded px-3 py-2 text-sm font-mono focus:border-purple-500 focus:outline-none"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="AUDITOR">AUDITOR</option>
                <option value="MODERATOR">MODERATOR</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={handleGrantRole} className="flex-1 bg-fuchsia-600/20 hover:bg-fuchsia-600/40 border border-fuchsia-500/50 text-fuchsia-300 py-2 rounded text-xs font-mono font-bold transition-all">
                Grant Role
              </button>
              <button onClick={handleRevokeRole} className="flex-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-300 py-2 rounded text-xs font-mono font-bold transition-all">
                Revoke Role
              </button>
            </div>
          </div>
        </div>

        {/* Treasury Management */}
        <div className="bg-black/40 border border-[var(--glass-border)] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold font-mono tracking-widest text-[var(--text-muted)] uppercase">Protocol Treasury</h3>
          </div>
          <p className="font-mono text-[10px] text-[var(--text-muted)] mt-1 mb-3 leading-relaxed italic">
            Withdraw accumulated protocol fees collected from repaid loans. Admin only operation.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-1 uppercase">Amount to Withdraw (Wei)</label>
              <input 
                type="number" 
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                placeholder="Amount in Wei"
                className="w-full bg-black/60 border border-[var(--glass-border)] rounded px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <button onClick={handleWithdraw} className="w-full bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 text-emerald-300 py-2 rounded text-xs font-mono font-bold transition-all">
              Withdraw Fees
            </button>
          </div>
        </div>

        {/* Risk Management */}
        <div className="bg-black/40 border border-[var(--glass-border)] rounded-lg p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold font-mono tracking-widest text-[var(--text-muted)] uppercase">Macro Risk Management</h3>
          </div>
          <p className="font-mono text-[10px] text-[var(--text-muted)] mt-1 mb-4 leading-relaxed italic">
            Force an AI consensus evaluation of the global macroeconomic risk index based on live BTC price and Fear & Greed Index. This dynamically adjusts interest rates for all active pools.
          </p>
          <button onClick={handleRebalance} className="w-full bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-300 py-3 rounded text-sm font-mono font-bold transition-all flex items-center justify-center gap-2">
            <Settings className="w-4 h-4 animate-spin-slow" />
            Rebalance Macro Risk Index
          </button>
        </div>

      </div>
    </div>
  );
};
