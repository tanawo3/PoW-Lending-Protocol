import re

with open("contracts/PoWLendingProtocol.py", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix float division in social_vouch
content = content.replace("weighted_quality = int((quality * voucher_identity_score) / 10000)", "weighted_quality = (quality * voucher_identity_score) // 10000")

# 2. Fix float division in _calculate_interest_rate_bps
content = content.replace("projected = base_rate - int((credit_score / 10000) * 200)", "projected = base_rate - ((credit_score * 200) // 10000)")

# 3. Fix float division in get_pool_health
content = content.replace("return str(projected / 100.0)", "return f\"{projected // 100}.{projected % 100:02d}\"")

# 4. Fix float division in check_pool_solvency
solvency_old = """            health_factor = total_collateral / total_debt
            if health_factor >= 1.5:
                status = "SECURE"
            elif health_factor >= 1.0:
                status = "AT_RISK"
            else:
                status = "INSOLVENT"
                
            return json.dumps({
                "status": status,
                "health_factor": f"{health_factor:.2f}",
                "total_collateral": total_collateral,
                "total_debt": total_debt
            })"""

solvency_new = """            health_factor_scaled = (total_collateral * 100) // total_debt
            if health_factor_scaled >= 150:
                status = "SECURE"
            elif health_factor_scaled >= 100:
                status = "AT_RISK"
            else:
                status = "INSOLVENT"
                
            return json.dumps({
                "status": status,
                "health_factor": f"{health_factor_scaled // 100}.{health_factor_scaled % 100:02d}",
                "total_collateral": total_collateral,
                "total_debt": total_debt
            })"""
content = content.replace(solvency_old, solvency_new)

# 5. Fix float division in _fetch_eth_balance
eth_bal_old = """        wei_bal = int(res_data["result"], 16)
        eth_bal = wei_bal / 10**18
        return f"{eth_bal:.4f} ETH" """

eth_bal_new = """        wei_bal = int(res_data["result"], 16)
        eth_whole = wei_bal // (10**18)
        eth_frac = (wei_bal % (10**18)) // (10**14) # 4 decimal places
        return f"{eth_whole}.{eth_frac:04d} ETH" """
content = content.replace(eth_bal_old, eth_bal_new)

# 6. Remove unused datetime import to keep namespace clean
content = content.replace("from datetime import datetime, timezone\n", "")

with open("contracts/PoWLendingProtocol.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Determinism fixed!")
