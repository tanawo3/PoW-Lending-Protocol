import sys

with open('contracts/PoWLendingProtocol.py', 'r') as f:
    content = f.read()

content = content.replace('decision = json.loads(result.calldata)', 'if isinstance(result, str): decision = json.loads(result)\n            else: decision = result if isinstance(result, dict) else {}')

content = content.replace('fraud_decision = json.loads(fraud_decision_raw.calldata)', 'if isinstance(fraud_decision_raw, str): fraud_decision = json.loads(fraud_decision_raw)\n            else: fraud_decision = fraud_decision_raw if isinstance(fraud_decision_raw, dict) else {}')

content = content.replace('decision = json.loads(decision_raw.calldata)', 'if isinstance(decision_raw, str): decision = json.loads(decision_raw)\n            else: decision = decision_raw if isinstance(decision_raw, dict) else {}')

with open('contracts/PoWLendingProtocol.py', 'w') as f:
    f.write(content)
