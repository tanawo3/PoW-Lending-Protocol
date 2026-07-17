import re

with open("contracts/PoWLendingProtocol.py", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove ProtocolState class definition entirely
content = re.sub(r'class ProtocolState:[\s\S]*?(?=class PoWLendingProtocol)', '', content)

# 2. Add flattened attributes to PoWLendingProtocol
attributes_to_add = """    total_processed: u256
    total_approved: u256
    total_rejected: u256
    total_revoked: u256
    total_capital_requested: u256
    total_capital_approved: u256
    global_risk_index_bps: u256
    macro_risk_reasoning: str
    last_macro_rebalance: str
"""
content = re.sub(r'    state: ProtocolState\n', attributes_to_add, content)

# 3. Fix __init__ assignments
init_replacement = """        self.total_processed = u256(0)
        self.total_approved = u256(0)
        self.total_rejected = u256(0)
        self.total_revoked = u256(0)
        self.total_capital_requested = u256(0)
        self.total_capital_approved = u256(0)
        self.global_risk_index_bps = u256(5000)
        self.macro_risk_reasoning = "Initial deployment."
        self.last_macro_rebalance = ""
"""
content = re.sub(r'        self\.state = ProtocolState\([\s\S]*?\n        \)', init_replacement, content)

# 4. Replace self.state.X with self.X everywhere
content = content.replace("self.state.", "self.")

with open("contracts/PoWLendingProtocol.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Flattened state variables!")
