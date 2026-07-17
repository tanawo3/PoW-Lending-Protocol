import sys

with open('contracts/PoWLendingProtocol.py', 'r') as f:
    content = f.read()

# Fix register_user
content = content.replace('try: decision = json.loads(decision_raw.calldata)', 'try:\n            if isinstance(decision_raw, str): decision = json.loads(decision_raw)\n            else: decision = decision_raw if isinstance(decision_raw, dict) else {}\n', 1)

# Fix rebalance_macro_risk
target_rebalance = '''        result = gl.vm.run_nondet(leader_fn, validator_fn)
        if not isinstance(result, gl.vm.Return):
            # Debug injection
            self.state.macro_risk_reasoning = f"Consensus failed! Result: {str(getattr(result, 'message', str(result)))}"
            return True
            
        try:
            data = json.loads(result.calldata)'''

replacement_rebalance = '''        result = gl.vm.run_nondet(leader_fn, validator_fn)
        try:
            data = result'''

content = content.replace(target_rebalance, replacement_rebalance)

# Fix evaluate_proposal
content = content.replace('try: decision = json.loads(decision_raw.calldata)', 'try:\n            if isinstance(decision_raw, str): decision = json.loads(decision_raw)\n            else: decision = decision_raw if isinstance(decision_raw, dict) else {}\n', 1)

# Fix file_dispute
content = content.replace('try: decision = json.loads(decision_raw.calldata)', 'try:\n            if isinstance(decision_raw, str): decision = json.loads(decision_raw)\n            else: decision = decision_raw if isinstance(decision_raw, dict) else {}\n', 1)

# Fix ai_vouch (already partially replaced by tool, let's fix it properly)
content = content.replace('try: decision = json.loads(decision_raw)\n        except Exception: decision = {"vouch_quality_bps": 0', 'try:\n            if isinstance(decision_raw, str): decision = json.loads(decision_raw)\n            else: decision = decision_raw if isinstance(decision_raw, dict) else {}\n        except Exception: decision = {"vouch_quality_bps": 0')

with open('contracts/PoWLendingProtocol.py', 'w') as f:
    f.write(content)
