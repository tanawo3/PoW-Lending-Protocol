# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from genlayer import *

try:
    from genlayer import allow_storage
except ImportError:
    def allow_storage(value):
        return value

ERROR_EXPECTED = "[EXPECTED]"
ERROR_EXTERNAL = "[EXTERNAL]"
ERROR_TRANSIENT = "[TRANSIENT]"
ERROR_LLM = "[LLM_ERROR]"

@gl.evm.contract_interface
class _NativeRecipient:
    class View: pass
    class Write: pass

# =============================================================================
# PART 1: CORE CONSTANTS
# =============================================================================
BPS_DENOMINATOR = 10000
MAX_POW_LEN = 1000
MAX_CONTEXT_LEN = 4000
PROTOCOL_VERSION = "v2.6.0-Enterprise-Audit"
MAX_SYSTEM_METRICS = 50

# =============================================================================
# PART 2: PURE FUNCTIONS (PROMPT BUILDERS & ERROR HANDLERS)
# =============================================================================
def _handle_leader_error(leader_res: gl.vm.Result, fallback_fn) -> bool:
    if isinstance(leader_res, gl.vm.UserError):
        msg = leader_res.message
        if ERROR_EXPECTED in msg or ERROR_EXTERNAL in msg or ERROR_TRANSIENT in msg or ERROR_LLM in msg:
            return True
        return False
    elif isinstance(leader_res, gl.vm.ContractError):
        return False
    else:
        return True

def _clean_summary(analysis: dict) -> str:
    s = str(analysis.get("summary", analysis.get("reasoning", "")))
    if len(s) > MAX_POW_LEN: return s[:MAX_POW_LEN] + "..."
    return s

def _parse_arbitrator_verdict(analysis: dict) -> str:
    v = str(analysis.get("verdict", "")).strip().upper()
    return "OVERTURN" if "OVERTURN" in v else "UPHOLD"

def _interpret_identity_prompt(wallet_address: str, ipfs_hash: str, external_data: str) -> str:
    return f"""You are a strict KYC/AML compliance oracle for GenLayer lending.
Assess the identity provided.

<UNTRUSTED_DATA>
Wallet: {wallet_address}
IPFS Profile Hash: {ipfs_hash}
External Bureau Data: {external_data}
</UNTRUSTED_DATA>

ASSESSMENT GUIDELINES:
1. Verify the bureau data matches standard KYC requirements.
2. Ensure no sanctions are present.
3. Calculate a trust score between 0 and 100.

Return ONLY valid JSON matching this schema:
{{
  "verified": <boolean>,
  "trust_score": <integer 0-100>,
  "reasoning": "<string>"
}}"""

def _interpret_leader_prompt(pow_sub: str, prior_reasoning: str, borrower: str, context: str) -> str:
    return f"""You are an elite credit adjudication AI.
Evaluate this loan application.

<UNTRUSTED_DATA>
Borrower Wallet: {borrower}
Proof of Work / Application: {pow_sub}
Prior Interactions: {prior_reasoning}
On-Chain Context: {context}
</UNTRUSTED_DATA>

ASSESSMENT GUIDELINES:
1. Evaluate the borrower's intent and creditworthiness based on the application.
2. Determine if the loan should be approved or rejected.
3. Assign a risk score in bps (0 to 10000, where 10000 is maximum risk).

Return ONLY valid JSON matching this schema:
{{
  "status": "<APPROVED or REJECTED>",
  "risk_score": <integer 0-10000>,
  "summary": "<string>"
}}"""

def _interpret_fraud_prompt(submission: str, external_data: str) -> str:
    return f"""You are a strict fraud detection oracle.

<UNTRUSTED_DATA>
Application: {submission}
External Oracle Data: {external_data}
</UNTRUSTED_DATA>

Return ONLY valid JSON matching this schema:
{{
  "is_fraud": <boolean>,
  "fraud_score": <integer 0-100>,
  "reasoning": "<string>"
}}"""

def _interpret_arbitrator_prompt(pow_sub: str, ai_reasoning: str, evidence: str) -> str:
    return f"""You are the final appeals arbitrator.

<UNTRUSTED_DATA>
Original Submission: {pow_sub}
Original AI Reasoning: {ai_reasoning}
New Evidence: {evidence}
</UNTRUSTED_DATA>

Return ONLY valid JSON matching this schema:
{{
  "verdict": "<UPHOLD or OVERTURN>",
  "summary": "<string>"
}}"""

# =============================================================================
# PART 3: PROTOCOL DATACLASSES
# =============================================================================
@allow_storage
@dataclass
class PoWSubmission:
    proposal_id: str
    borrower: str
    requested_amount: u256
    pow_submission: str
    status: str
    ai_reasoning: str
    risk_score: u256
    collateral: u256
    debt: u256
    pool_id: str
    last_updated: str
    encrypted_evidence: str
    plaintext_evidence: str

# =============================================================================
# PART 4: THE GENVM CONTRACT
# =============================================================================
class PoWLendingProtocol(gl.Contract):
    # PILLAR 22: Native Types declared as class properties, NOT instantiated in __init__
    proposals: TreeMap[str, PoWSubmission]
    proposal_ids: DynArray[str]
    pools: TreeMap[str, str]
    pool_ids: DynArray[str]
    markets: TreeMap[str, str]
    market_ids: DynArray[str]
    balances: TreeMap[str, u256]
    borrowers: TreeMap[str, str]

    def __init__(self):
        self.owner = str(gl.message.sender_address)
        self.total_loans = u256(0)
        self.total_approved = u256(0)
        self.total_rejected = u256(0)
        self.total_defaulted = u256(0)
        self.total_revoked = u256(0)
        self.total_capital_approved = u256(0)
        self.global_risk_index_bps = u256(0)
        self.pool_counter = u256(0)
        self.treasury_balance = u256(0)
        self.market_counter = u256(0)

    def _now(self) -> str:
        try: return str(gl.block.timestamp)
        except: return "0"

    def _get_borrower(self, address: str) -> dict:
        b = getattr(self.borrowers, address, None)
        if b:
            try: return json.loads(b)
            except: return {}
        return {"wallet_trust_score": 0, "income_score": 0, "reputation_score": 0, "vouch_score": 0, "kyc_verified": False}

    def _save_borrower(self, address: str, profile: dict):
        self.borrowers[address] = json.dumps(profile)

    def _get_pool(self, pool_id: str) -> dict:
        p = getattr(self.pools, pool_id, None)
        if p:
            try: return json.loads(p)
            except: return {}
        return {}

    def _save_pool(self, pool_id: str, pool: dict):
        self.pools[pool_id] = json.dumps(pool)
        
    def _get_market(self, market_id: str) -> dict:
        m = getattr(self.markets, market_id, None)
        if m:
            try: return json.loads(m)
            except: return {}
        return {}
        
    def _save_market(self, market_id: str, market: dict):
        self.markets[market_id] = json.dumps(market)

    # =============================================================================
    # KYC & ORACLE LOGIC
    # =============================================================================
    @gl.public.write
    def submit_identity_verification(self, ipfs_hash: str) -> bool:
        borrower_address = str(gl.message.sender_address)
        
        def leader_fn() -> dict:
            try:
                res = gl.nondet.web.get(f"https://dummy-kyc-api.com/verify?hash={ipfs_hash}")
                ext_data = res.body.decode('utf-8')
            except Exception:
                ext_data = "Error fetching KYC data"
                
            prompt = _interpret_identity_prompt(borrower_address, ipfs_hash, ext_data)
            analysis = gl.nondet.exec_prompt(prompt, response_format="json")
            return {"verified": bool(analysis.get("verified")), "trust_score": int(analysis.get("trust_score", 0)), "reasoning": _clean_summary(analysis)}
            
        def validator_fn(leader_res: gl.vm.Result) -> bool:
            if not isinstance(leader_res, gl.vm.Return): return _handle_leader_error(leader_res, leader_fn)
            try:
                mine = leader_fn()
                ld_data = leader_res.calldata
                if not isinstance(ld_data, dict): return False
                return mine.get("verified") == ld_data.get("verified") and abs(mine.get("trust_score", 0) - ld_data.get("trust_score", 0)) <= 10
            except: return False
            
        result = gl.vm.run_nondet(leader_fn, validator_fn)
        prof = self._get_borrower(borrower_address)
        prof["kyc_verified"] = result["verified"]
        if result["verified"]:
            prof["wallet_trust_score"] = min(100, int(prof.get("wallet_trust_score", 0)) + result["trust_score"])
        self._save_borrower(borrower_address, prof)
        return True

    # =============================================================================
    # LIQUIDITY POOLS & DEFI
    # =============================================================================
    @gl.public.write
    def create_pool(self, name: str, risk_tolerance_bps: int, min_deposit: int) -> str:
        if str(gl.message.sender_address) != self.owner: raise gl.vm.UserError(f"{ERROR_EXPECTED} Owner only")
        pid = f"pool_{int(self.pool_counter)}"
        self.pool_counter = u256(int(self.pool_counter) + 1)
        p = {
            "pool_id": pid, "name": name, "risk_tolerance_bps": risk_tolerance_bps,
            "min_deposit": min_deposit, "total_deposited_wei": 0, "available_liquidity_wei": 0,
            "status": "ACTIVE"
        }
        self._save_pool(pid, p)
        self.pool_ids.append(pid)
        return pid

    @gl.public.write.payable
    def deposit_liquidity(self, pool_id: str) -> bool:
        if pool_id not in self.pools: raise gl.vm.UserError(f"{ERROR_EXPECTED} Invalid pool")
        p = self._get_pool(pool_id)
        if p.get("status") != "ACTIVE": raise gl.vm.UserError(f"{ERROR_EXPECTED} Inactive pool")
        val = int(gl.message.value)
        if val < int(p.get("min_deposit", 0)): raise gl.vm.UserError(f"{ERROR_EXPECTED} Below minimum")
        p["total_deposited_wei"] = int(p.get("total_deposited_wei", 0)) + val
        p["available_liquidity_wei"] = int(p.get("available_liquidity_wei", 0)) + val
        self._save_pool(pool_id, p)
        return True

    # =============================================================================
    # PROPOSAL & CONSENSUS MECHANISMS
    # =============================================================================
    @gl.public.write.payable
    def submit_proposal(self, pow_submission: str, requested_amount: int, pool_id: str) -> str:
        prof = self._get_borrower(str(gl.message.sender_address))
        if not prof.get("kyc_verified", False): raise gl.vm.UserError(f"{ERROR_EXPECTED} KYC Required")
        
        pid = f"prop_{int(self.total_loans)}"
        self.total_loans = u256(int(self.total_loans) + 1)
        
        self.proposals[pid] = PoWSubmission(
            proposal_id=pid, borrower=str(gl.message.sender_address), requested_amount=u256(requested_amount),
            pow_submission=pow_submission, status="PENDING", ai_reasoning="", risk_score=u256(0),
            collateral=u256(int(gl.message.value)), debt=u256(0), pool_id=pool_id, last_updated=self._now(),
            encrypted_evidence="", plaintext_evidence=""
        )
        self.proposal_ids.append(pid)
        return pid

    @gl.public.write
    def evaluate_proposal(self, proposal_id: str) -> bool:
        if proposal_id not in self.proposals: raise gl.vm.UserError(f"{ERROR_EXPECTED} Not found")
        prop = self.proposals[proposal_id]
        if prop.status != "PENDING": raise gl.vm.UserError(f"{ERROR_EXPECTED} Not pending")
        
        pool = self._get_pool(prop.pool_id) if prop.pool_id else None
        risk_tol = pool.get("risk_tolerance_bps", 10000) if pool else 10000
        
        borrower_profile = self._get_borrower(prop.borrower)
        context = f"Trust: {borrower_profile.get('wallet_trust_score')} Pool Risk: {risk_tol}"
        
        def leader_fn() -> dict:
            prompt = _interpret_leader_prompt(prop.pow_submission, "", prop.borrower, context)
            analysis = gl.nondet.exec_prompt(prompt, response_format="json")
            s = str(analysis.get("status", "")).strip().upper()
            status = "APPROVED" if s == "APPROVED" else "REJECTED"
            return {"status": status, "risk_score": int(analysis.get("risk_score", 10000)), "summary": _clean_summary(analysis)}
            
        def validator_fn(leader_res: gl.vm.Result) -> bool:
            if not isinstance(leader_res, gl.vm.Return): return _handle_leader_error(leader_res, leader_fn)
            try:
                mine = leader_fn()
                ld_data = leader_res.calldata
                if not isinstance(ld_data, dict): return False
                return mine.get("status") == ld_data.get("status") and abs(mine.get("risk_score", 10000) - ld_data.get("risk_score", 10000)) <= 1000
            except: return False
                
        decision = gl.vm.run_nondet(leader_fn, validator_fn)
        
        prop.status = decision["status"]
        prop.risk_score = u256(decision["risk_score"])
        prop.ai_reasoning = decision["summary"]
        prop.last_updated = self._now()
        
        if prop.status == "APPROVED" and prop.risk_score <= risk_tol and pool and pool.get("available_liquidity_wei", 0) >= int(prop.requested_amount):
            pool["available_liquidity_wei"] -= int(prop.requested_amount)
            self._save_pool(prop.pool_id, pool)
            prop.debt = u256(int(prop.requested_amount) + (int(prop.requested_amount) // 20)) # 5% Interest
            _NativeRecipient(Address(prop.borrower)).emit_transfer(value=prop.requested_amount)
            self.total_approved = u256(int(self.total_approved) + 1)
            self.total_capital_approved = u256(int(self.total_capital_approved) + int(prop.requested_amount))
            self._recalculate_global_risk()
        else:
            prop.status = "REJECTED"
            self.total_rejected = u256(int(self.total_rejected) + 1)
            if int(prop.collateral) > 0:
                _NativeRecipient(Address(prop.borrower)).emit_transfer(value=prop.collateral)
                prop.collateral = u256(0)
                
        self.proposals[proposal_id] = prop
        return True

    # =============================================================================
    # APPEALS & GOVERNANCE
    # =============================================================================
    @gl.public.write
    def appeal_loan_decision(self, proposal_id: str, dispute_evidence: str) -> bool:
        if proposal_id not in self.proposals: raise gl.vm.UserError(f"{ERROR_EXPECTED} Not found")
        prop = self.proposals[proposal_id]
        if prop.status != "REJECTED": raise gl.vm.UserError(f"{ERROR_EXPECTED} Not rejected")
        
        def leader_fn() -> dict:
            prompt = _interpret_arbitrator_prompt(prop.pow_submission, prop.ai_reasoning, dispute_evidence)
            analysis = gl.nondet.exec_prompt(prompt, response_format="json")
            return {"verdict": _parse_arbitrator_verdict(analysis), "summary": _clean_summary(analysis)}
            
        def validator_fn(leader_res: gl.vm.Result) -> bool:
            if not isinstance(leader_res, gl.vm.Return): return _handle_leader_error(leader_res, leader_fn)
            try:
                mine = leader_fn()
                ld_data = leader_res.calldata
                if not isinstance(ld_data, dict): return False
                return mine.get("verdict") == ld_data.get("verdict")
            except: return False
                
        decision = gl.vm.run_nondet(leader_fn, validator_fn)
        if decision["verdict"] == "OVERTURN":
            prop.status = "APPROVED"
            prop.ai_reasoning += " [OVERTURNED BY ARBITRATION]"
            self.total_approved = u256(int(self.total_approved) + 1)
            
        self.proposals[proposal_id] = prop
        return True

    @gl.public.write.payable
    def repay_loan(self, proposal_id: str) -> bool:
        if proposal_id not in self.proposals: raise gl.vm.UserError(f"{ERROR_EXPECTED} Not found")
        prop = self.proposals[proposal_id]
        if str(gl.message.sender_address) != prop.borrower: raise gl.vm.UserError(f"{ERROR_EXPECTED} Unauthorized")
        if prop.status != "APPROVED": raise gl.vm.UserError(f"{ERROR_EXPECTED} Not active")
        debt = int(prop.debt)
        if gl.message.value < debt: raise gl.vm.UserError(f"{ERROR_EXPECTED} Insufficient. Need {debt}")
        
        excess = int(gl.message.value) - debt
        refund_amount = int(prop.collateral) + excess if excess > 0 else int(prop.collateral)
        fee = debt // 100
        pool_return = debt - fee
        self.treasury_balance = u256(int(self.treasury_balance) + fee)
        
        if prop.pool_id:
            pool = self._get_pool(prop.pool_id)
            if pool:
                pool["available_liquidity_wei"] = int(pool.get("available_liquidity_wei", 0)) + pool_return
                pool["total_deposited_wei"] = int(pool.get("total_deposited_wei", 0)) + (pool_return - int(prop.requested_amount))
                self._save_pool(prop.pool_id, pool)
            
        prop.status = "REPAID"
        prop.debt = u256(0)
        prop.last_updated = self._now()
        self.proposals[proposal_id] = prop
        
        prof = self._get_borrower(prop.borrower)
        prof["wallet_trust_score"] = min(100, int(prof.get("wallet_trust_score", 0)) + 5)
        self._save_borrower(prop.borrower, prof)
        
        if refund_amount > 0: _NativeRecipient(Address(prop.borrower)).emit_transfer(value=u256(refund_amount))
        return True

    @gl.public.write
    def mark_default(self, proposal_id: str) -> bool:
        if str(gl.message.sender_address) != self.owner: raise gl.vm.UserError(f"{ERROR_EXPECTED} Owner only")
        if proposal_id not in self.proposals: raise gl.vm.UserError(f"{ERROR_EXPECTED} Not found")
        prop = self.proposals[proposal_id]
        if prop.status != "APPROVED": raise gl.vm.UserError(f"{ERROR_EXPECTED} Not active")
            
        prop.status = "DEFAULTED"
        prop.ai_reasoning = "Marked as DEFAULTED by admin."
        self.proposals[proposal_id] = prop
        
        self.total_defaulted = u256(int(self.total_defaulted) + 1)
        
        profile = self._get_borrower(prop.borrower)
        profile["wallet_trust_score"] = max(0, int(profile.get("wallet_trust_score", 0)) - 50)
        self._save_borrower(prop.borrower, profile)
        return True

    @gl.public.write
    def revoke_proposal(self, proposal_id: str) -> bool:
        if proposal_id not in self.proposals: raise gl.vm.UserError(f"{ERROR_EXPECTED} Not found")
        prop = self.proposals[proposal_id]
        if str(gl.message.sender_address) != prop.borrower: raise gl.vm.UserError(f"{ERROR_EXPECTED} Unauthorized")
        if prop.status == "REVOKED": return True
        if prop.status == "PENDING" and int(prop.collateral) > 0:
            _NativeRecipient(Address(prop.borrower)).emit_transfer(value=prop.collateral)
            prop.collateral = u256(0)
            
        old_status = prop.status
        prop.status = "REVOKED"
        prop.ai_reasoning = "Revoked by borrower."
        prop.last_updated = self._now()
        self.proposals[proposal_id] = prop
        self.total_revoked = u256(int(self.total_revoked) + 1)
        
        if old_status == "APPROVED":
            self.total_approved = u256(int(self.total_approved) - 1)
            self.total_capital_approved = u256(int(self.total_capital_approved) - int(prop.requested_amount))
            self._recalculate_global_risk()
        return True

    def _recalculate_global_risk(self):
        total_weight = 0
        total_risk = 0
        count = 0
        idx = len(self.proposal_ids) - 1
        while idx >= 0 and count < MAX_SYSTEM_METRICS:
            p = self.proposals[self.proposal_ids[idx]]
            if p.status == "APPROVED":
                amt = int(p.requested_amount)
                total_weight += amt
                total_risk += (amt * int(p.risk_score))
                count += 1
            idx -= 1
        self.global_risk_index_bps = u256(total_risk // total_weight) if total_weight > 0 else u256(0)

    # =============================================================================
    # SPECULATIVE MARKETS (DeFi Betting)
    # =============================================================================
    @gl.public.write
    def create_market(self, proposal_id: str, description: str) -> str:
        if str(gl.message.sender_address) != self.owner: raise gl.vm.UserError(f"{ERROR_EXPECTED} Owner only")
        mid = f"mkt_{int(self.market_counter)}"
        self.market_counter = u256(int(self.market_counter) + 1)
        
        m = {
            "market_id": mid, "proposal_id": proposal_id, "description": description,
            "pool_yes_wei": 0, "pool_no_wei": 0, "status": "OPEN", "outcome": ""
        }
        self._save_market(mid, m)
        self.market_ids.append(mid)
        return mid

    @gl.public.write.payable
    def place_bet(self, market_id: str, vote_yes: bool) -> bool:
        if market_id not in self.markets: raise gl.vm.UserError(f"{ERROR_EXPECTED} Invalid market")
        m = self._get_market(market_id)
        if m.get("status") != "OPEN": raise gl.vm.UserError(f"{ERROR_EXPECTED} Market closed")
        
        val = int(gl.message.value)
        if val <= 0: raise gl.vm.UserError(f"{ERROR_EXPECTED} Zero bet")
        
        if vote_yes:
            m["pool_yes_wei"] = int(m.get("pool_yes_wei", 0)) + val
        else:
            m["pool_no_wei"] = int(m.get("pool_no_wei", 0)) + val
            
        self._save_market(market_id, m)
        return True

    @gl.public.write
    def resolve_market(self, market_id: str, outcome_yes: bool) -> bool:
        if str(gl.message.sender_address) != self.owner: raise gl.vm.UserError(f"{ERROR_EXPECTED} Owner only")
        if market_id not in self.markets: raise gl.vm.UserError(f"{ERROR_EXPECTED} Invalid market")
        
        m = self._get_market(market_id)
        if m.get("status") != "OPEN": raise gl.vm.UserError(f"{ERROR_EXPECTED} Not open")
        
        m["status"] = "RESOLVED"
        m["outcome"] = "YES" if outcome_yes else "NO"
        self._save_market(market_id, m)
        # Note: payout logic goes here in full impl, omitting loop for gas safety
        return True

    @gl.public.write
    def update_market_status(self, market_id: str, new_status: str) -> bool:
        if str(gl.message.sender_address) != self.owner: raise gl.vm.UserError(f"{ERROR_EXPECTED} Owner only")
        if market_id not in self.markets: raise gl.vm.UserError(f"{ERROR_EXPECTED} Invalid market")
        m = self._get_market(market_id)
        m["status"] = new_status
        self._save_market(market_id, m)
        return True

    # =============================================================================
    # ZERO-KNOWLEDGE EVIDENCE
    # =============================================================================
    @gl.public.write
    def submit_encrypted_evidence(self, proposal_id: str, encrypted_payload: str) -> None:
        if proposal_id not in self.proposals: raise gl.vm.UserError(f"{ERROR_EXPECTED} Not found")
        prop = self.proposals[proposal_id]
        if str(gl.message.sender_address) != prop.borrower: raise gl.vm.UserError(f"{ERROR_EXPECTED} Unauthorized")
        prop.encrypted_evidence = encrypted_payload
        self.proposals[proposal_id] = prop

    @gl.public.write
    def reveal_agreement(self, proposal_id: str, plaintext: str, salt: str) -> bool:
        if proposal_id not in self.proposals: raise gl.vm.UserError(f"{ERROR_EXPECTED} Not found")
        prop = self.proposals[proposal_id]
        if str(gl.message.sender_address) not in [prop.borrower, self.owner]: raise gl.vm.UserError(f"{ERROR_EXPECTED} Unauthorized")
        prop.plaintext_evidence = plaintext
        self.proposals[proposal_id] = prop
        return True

    # =============================================================================
    # VIEWS & ACCESSORS
    # =============================================================================
    @gl.public.view
    def fetch_all_proposals(self) -> str:
        out = []
        for pid in self.proposal_ids:
            p = self.proposals[pid]
            out.append({
                "proposal_id": p.proposal_id, "borrower": p.borrower, "requested_amount": int(p.requested_amount),
                "pow_submission": p.pow_submission, "status": p.status, "ai_reasoning": p.ai_reasoning,
                "risk_score": int(p.risk_score), "collateral": str(int(p.collateral)), "debt": str(int(p.debt)),
                "pool_id": p.pool_id
            })
        return json.dumps(out)

    @gl.public.view
    def get_borrower_profile(self, address: str) -> str:
        prof = self._get_borrower(address)
        return json.dumps(prof)
