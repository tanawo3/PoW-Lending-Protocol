import genlayer as gl
import json
from genlayer import DynArray, TreeMap

class _NativeRecipient(gl.Contract):
    @gl.public.payable
    def emit_transfer(self) -> None:
        pass

def allow_storage(value):
    return value

def _sender() -> str:
    try: return str(gl.message.sender_account)
    except:
        try: return str(gl.message.sender_address)
        except: return "0x0000000000000000000000000000000000000000"

def _handle_leader_error(leader_res: gl.vm.Result, fallback_fn) -> bool:
    if leader_res.mode != "SUCCESS":
        return fallback_fn()
    return True

@allow_storage
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
    plaintext_evidence: str
    encrypted_payload: str

    def __init__(self, proposal_id: str, borrower: str, requested_amount: u256, pow_submission: str, status: str, ai_reasoning: str, risk_score: u256, collateral: u256, debt: u256, pool_id: str, last_updated: str):
        self.proposal_id = proposal_id
        self.borrower = borrower
        self.requested_amount = requested_amount
        self.pow_submission = pow_submission
        self.status = status
        self.ai_reasoning = ai_reasoning
        self.risk_score = risk_score
        self.collateral = collateral
        self.debt = debt
        self.pool_id = pool_id
        self.last_updated = last_updated
        self.plaintext_evidence = ""
        self.encrypted_payload = ""

@allow_storage
class Market:
    market_id: str
    proposal_id: str
    description: str
    total_yes: u256
    total_no: u256
    resolved: bool
    outcome_yes: bool

    def __init__(self, market_id: str, proposal_id: str, description: str):
        self.market_id = market_id
        self.proposal_id = proposal_id
        self.description = description
        self.total_yes = u256(0)
        self.total_no = u256(0)
        self.resolved = False
        self.outcome_yes = False

class PoWLendingProtocol(gl.Contract):
    proposals: TreeMap[str, PoWSubmission]
    borrower_profiles: TreeMap[str, str]
    pools: TreeMap[str, str]
    markets: TreeMap[str, Market]
    total_loans: u256
    pool_counter: u256
    market_counter: u256
    owner: str

    def __init__(self):
        self.total_loans = u256(0)
        self.pool_counter = u256(0)
        self.market_counter = u256(0)
        self.owner = _sender()

    def _now(self) -> str:
        try: return str(gl.block.timestamp)
        except: return "0"

    def _require_owner(self):
        if _sender() != self.owner:
            raise gl.vm.UserError("Owner only")

    # VIEWS
    @gl.public.view
    def get_borrower_profile(self, address: str) -> str:
        if address in self.borrower_profiles:
            return self.borrower_profiles[address]
        return json.dumps({"address": address, "kyc_verified": False, "wallet_trust_score": 0})

    @gl.public.view
    def get_all_proposals(self) -> str:
        res = []
        for pid in self.proposals:
            p = self.proposals[pid]
            res.append({
                "proposal_id": p.proposal_id, "borrower": p.borrower, "requested_amount": int(p.requested_amount),
                "pow_submission": p.pow_submission, "status": p.status, "ai_reasoning": p.ai_reasoning,
                "risk_score": int(p.risk_score), "collateral": int(p.collateral), "debt": int(p.debt),
                "pool_id": p.pool_id, "last_updated": p.last_updated
            })
        return json.dumps(res)

    @gl.public.view
    def get_all_pools(self) -> str:
        res = []
        for pid in self.pools:
            res.append(json.loads(self.pools[pid]))
        return json.dumps(res)

    @gl.public.view
    def get_all_markets(self) -> str:
        res = []
        for mid in self.markets:
            m = self.markets[mid]
            res.append({
                "market_id": m.market_id, "proposal_id": m.proposal_id, "description": m.description,
                "total_yes": int(m.total_yes), "total_no": int(m.total_no),
                "resolved": m.resolved, "outcome_yes": m.outcome_yes
            })
        return json.dumps(res)

    # 1. KYC
    @gl.public.write
    def submit_identity_verification(self, ipfs_hash: str) -> bool:
        def leader_fn() -> dict:
            prompt = f"Verify KYC for doc {ipfs_hash}. Output JSON: {{\"verified\": true, \"confidence\": 95}}"
            res = gl.nondet.llm.call(prompt=prompt, model="gemini-3.1-pro")
            return {"calldata": res.message}
            
        def validator_fn(leader_res: gl.vm.Result) -> bool:
            if not _handle_leader_error(leader_res, lambda: False): return False
            data = json.loads(leader_res.calldata)
            if data.get("verified", False):
                prof = json.loads(self.get_borrower_profile(_sender()))
                prof["kyc_verified"] = True
                prof["wallet_trust_score"] = int(data.get("confidence", 50))
                self.borrower_profiles[_sender()] = json.dumps(prof)
            return True
            
        return gl.run_nondet(leader_fn, validator_fn)

    # 2. CREATE POOL
    @gl.public.write
    def create_pool(self, name: str, risk_tolerance_bps: int, min_deposit: int) -> str:
        self._require_owner()
        pid = f"pool_{int(self.pool_counter)}"
        self.pool_counter = u256(int(self.pool_counter) + 1)
        self.pools[pid] = json.dumps({
            "pool_id": pid, "name": name, "risk_tolerance_bps": risk_tolerance_bps,
            "min_deposit": min_deposit, "total_liquidity": 0, "available_liquidity": 0
        })
        return pid

    @gl.public.payable
    def deposit_liquidity(self, pool_id: str) -> bool:
        if pool_id not in self.pools: raise gl.vm.UserError("Not found")
        pool = json.loads(self.pools[pool_id])
        pool["total_liquidity"] += int(gl.message.value)
        pool["available_liquidity"] += int(gl.message.value)
        self.pools[pool_id] = json.dumps(pool)
        self.treasury_balance = u256(int(self.treasury_balance) + int(gl.message.value))
        return True

    @gl.public.write
    def withdraw_liquidity(self, pool_id: str, amount: int) -> bool:
        if pool_id not in self.pools: raise gl.vm.UserError("Not found")
        pool = json.loads(self.pools[pool_id])
        if pool["available_liquidity"] < amount: raise gl.vm.UserError("Insufficient liquidity")
        pool["total_liquidity"] -= amount
        pool["available_liquidity"] -= amount
        self.pools[pool_id] = json.dumps(pool)
        self.treasury_balance = u256(int(self.treasury_balance) - amount)
        _NativeRecipient(_sender()).emit_transfer(value=u256(amount))
        return True

    # 3. SUBMIT PROPOSAL
    @gl.public.payable
    def submit_proposal(self, pow_submission: str, requested_amount: int, pool_id: str) -> str:
        prof = json.loads(self.get_borrower_profile(_sender()))
        if not prof.get("kyc_verified", False): raise gl.vm.UserError("KYC Required")
        
        pid = f"prop_{int(self.total_loans)}"
        self.total_loans = u256(int(self.total_loans) + 1)
        
        self.proposals[pid] = PoWSubmission(
            pid, _sender(), u256(requested_amount), pow_submission, "PENDING", "", u256(0),
            u256(int(gl.message.value)), u256(0), pool_id, self._now()
        )
        return pid

    # 4. EVALUATE PROPOSAL
    @gl.public.write
    def evaluate_proposal(self, proposal_id: str) -> bool:
        if proposal_id not in self.proposals: raise gl.vm.UserError("Not found")
        prop = self.proposals[proposal_id]
        if prop.status != "PENDING": raise gl.vm.UserError("Not pending")

        def leader_fn() -> dict:
            prompt = f"Evaluate PoW: <UNTRUSTED_DATA>{prop.pow_submission}</UNTRUSTED_DATA>. Output JSON: {{\"approve\": true, \"risk_score\": 500, \"reasoning\": \"Looks good\"}}"
            res = gl.nondet.llm.call(prompt=prompt, model="gemini-3.1-pro")
            return {"calldata": res.message}
            
        def validator_fn(leader_res: gl.vm.Result) -> bool:
            if not _handle_leader_error(leader_res, lambda: False): return False
            data = json.loads(leader_res.calldata)
            prop.ai_reasoning = data.get("reasoning", "")
            prop.risk_score = u256(data.get("risk_score", 10000))
            if data.get("approve", False):
                prop.status = "APPROVED"
                prop.debt = prop.requested_amount
            else:
                prop.status = "REJECTED"
                if int(prop.collateral) > 0:
                    _NativeRecipient(prop.borrower).emit_transfer(value=prop.collateral)
                    prop.collateral = u256(0)
            prop.last_updated = self._now()
            self.proposals[proposal_id] = prop
            return True
            
        return gl.run_nondet(leader_fn, validator_fn)

    # 5. REPAY
    @gl.public.payable
    def repay_loan(self, proposal_id: str) -> bool:
        if proposal_id not in self.proposals: raise gl.vm.UserError("Not found")
        prop = self.proposals[proposal_id]
        if prop.status != "APPROVED": raise gl.vm.UserError("Not approved")
        
        repayment = int(gl.message.value)
        current_debt = int(prop.debt)
        if repayment >= current_debt:
            prop.debt = u256(0)
            prop.status = "REPAID"
            if int(prop.collateral) > 0:
                _NativeRecipient(prop.borrower).emit_transfer(value=prop.collateral)
                prop.collateral = u256(0)
        else:
            prop.debt = u256(current_debt - repayment)
        prop.last_updated = self._now()
        self.proposals[proposal_id] = prop
        return True

    @gl.public.write
    def revoke_proposal(self, proposal_id: str) -> bool:
        if proposal_id not in self.proposals: raise gl.vm.UserError("Not found")
        prop = self.proposals[proposal_id]
        if _sender() != prop.borrower: raise gl.vm.UserError("Unauthorized")
        if prop.status == "PENDING" and int(prop.collateral) > 0:
            _NativeRecipient(prop.borrower).emit_transfer(value=prop.collateral)
            prop.collateral = u256(0)
        prop.status = "REVOKED"
        prop.last_updated = self._now()
        self.proposals[proposal_id] = prop
        return True

    # 6. MARK DEFAULT
    @gl.public.write
    def mark_default(self, proposal_id: str) -> bool:
        self._require_owner()
        if proposal_id not in self.proposals: raise gl.vm.UserError("Not found")
        prop = self.proposals[proposal_id]
        if prop.status != "APPROVED": raise gl.vm.UserError("Not approved")
        prop.status = "DEFAULTED"
        prop.last_updated = self._now()
        self.proposals[proposal_id] = prop
        return True

    # 7. APPEAL
    @gl.public.write
    def appeal_loan_decision(self, proposal_id: str, dispute_evidence: str) -> bool:
        if proposal_id not in self.proposals: raise gl.vm.UserError("Not found")
        prop = self.proposals[proposal_id]
        if prop.status not in ["REJECTED", "DEFAULTED"]: raise gl.vm.UserError("Cannot appeal")
        
        def leader_fn() -> dict:
            prompt = f"Appeal: {dispute_evidence}. Output JSON: {{\"approve\": true, \"reasoning\": \"Valid\"}}"
            res = gl.nondet.llm.call(prompt=prompt, model="gemini-3.1-pro")
            return {"calldata": res.message}
            
        def validator_fn(leader_res: gl.vm.Result) -> bool:
            if not _handle_leader_error(leader_res, lambda: False): return False
            data = json.loads(leader_res.calldata)
            prop.ai_reasoning = f"[APPEAL] {data.get('reasoning', '')}"
            if data.get("approve", False):
                prop.status = "APPROVED"
                prop.debt = prop.requested_amount
            prop.last_updated = self._now()
            self.proposals[proposal_id] = prop
            return True
            
        return gl.run_nondet(leader_fn, validator_fn)

    # 8. SUBMIT EVIDENCE
    @gl.public.write
    def submit_encrypted_evidence(self, proposal_id: str, encrypted_payload: str) -> None:
        if proposal_id not in self.proposals: raise gl.vm.UserError("Not found")
        prop = self.proposals[proposal_id]
        if _sender() != prop.borrower: raise gl.vm.UserError("Unauthorized")
        prop.encrypted_payload = encrypted_payload
        self.proposals[proposal_id] = prop

    # 9. REVEAL AGREEMENT
    @gl.public.write
    def reveal_agreement(self, proposal_id: str, plaintext: str, salt: str) -> bool:
        if proposal_id not in self.proposals: raise gl.vm.UserError("Not found")
        prop = self.proposals[proposal_id]
        if _sender() not in [prop.borrower, self.owner]: raise gl.vm.UserError("Unauthorized")
        prop.plaintext_evidence = plaintext
        self.proposals[proposal_id] = prop
        return True

    # 10. CREATE MARKET
    @gl.public.write
    def create_market(self, proposal_id: str, description: str) -> str:
        self._require_owner()
        mid = f"mkt_{int(self.market_counter)}"
        self.market_counter = u256(int(self.market_counter) + 1)
        self.markets[mid] = Market(mid, proposal_id, description)
        return mid

    @gl.public.payable
    def place_bet(self, market_id: str, bet_on_yes: bool) -> bool:
        if market_id not in self.markets: raise gl.vm.UserError("Not found")
        m = self.markets[market_id]
        if m.resolved: raise gl.vm.UserError("Market resolved")
        if bet_on_yes:
            m.total_yes = u256(int(m.total_yes) + int(gl.message.value))
        else:
            m.total_no = u256(int(m.total_no) + int(gl.message.value))
        self.markets[market_id] = m
        return True
