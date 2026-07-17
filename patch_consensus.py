import re

with open("contracts/PoWLendingProtocol.py", "r", encoding="utf-8") as f:
    content = f.read()

# Fix 1: verify_identity
verify_identity_old = """                mine = json.loads(leader_fn())
                ld_data = json.loads(leader_res.calldata)
                return mine.get("kyc_status", "") == ld_data.get("kyc_status", "")"""
verify_identity_new = """                ld_data = json.loads(leader_res.calldata)
                status = ld_data.get("kyc_status", "")
                return status in ["VERIFIED", "REJECTED"]"""
content = content.replace(verify_identity_old, verify_identity_new)

# Fix 2: evaluate_proposal
eval_old = """                mine = json.loads(leader_fn())
                ld_data = json.loads(leader_res.calldata)
                return mine["verdict"] == ld_data["verdict"] and isinstance(ld_data.get("risk_score"), int)"""
eval_new = """                ld_data = json.loads(leader_res.calldata)
                valid_verdict = ld_data.get("verdict") in ["APPROVED", "REJECTED"]
                valid_risk = isinstance(ld_data.get("risk_score"), int)
                return valid_verdict and valid_risk"""
content = content.replace(eval_old, eval_new)

# Fix 3: appeal_proposal
appeal_old = """                mine = json.loads(leader_fn())
                ld_data = json.loads(leader_res.calldata)
                return mine["verdict"] == ld_data["verdict"]"""
appeal_new = """                ld_data = json.loads(leader_res.calldata)
                return ld_data.get("verdict") in ["UPHOLD", "OVERTURN"]"""
content = content.replace(appeal_old, appeal_new)

# Fix 4: social_vouch
vouch_old = """                mine = json.loads(leader_fn())
                ld_data = json.loads(leader_res.calldata)
                return isinstance(ld_data.get("vouch_quality_bps"), int)"""
vouch_new = """                ld_data = json.loads(leader_res.calldata)
                return isinstance(ld_data.get("vouch_quality_bps"), int)"""
content = content.replace(vouch_old, vouch_new)

with open("contracts/PoWLendingProtocol.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Validator Equivalence patched!")
