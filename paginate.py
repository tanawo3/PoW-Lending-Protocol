import re

with open('contracts/PoWLendingProtocol.py', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update get_all_pools
pools_old = """    def get_all_pools(self) -> str:
        pools = []
        for pid in self.pool_ids:"""
pools_new = """    def get_all_pools(self, offset: int = 0, limit: int = 50) -> str:
        pools = []
        total = len(self.pool_ids)
        lim = min(max(int(limit), 1), 50)
        off = max(int(offset), 0)
        end = min(off + lim, total)
        for i in range(off, end):
            pid = self.pool_ids[i]"""
code = code.replace(pools_old, pools_new)

# 2. Update get_all_markets
markets_old = """    def get_all_markets(self) -> str:
        markets_list = []
        for mid in self.market_ids:"""
markets_new = """    def get_all_markets(self, offset: int = 0, limit: int = 50) -> str:
        markets_list = []
        total = len(self.market_ids)
        lim = min(max(int(limit), 1), 50)
        off = max(int(offset), 0)
        end = min(off + lim, total)
        for i in range(off, end):
            mid = self.market_ids[i]"""
code = code.replace(markets_old, markets_new)

# 3. Update fetch_all_proposals
props_old = """    def fetch_all_proposals(self) -> str:
        \"\"\"
        Retrieves all proposals for external React/Next.js frontend consumption.
        \"\"\"
        out = []
        for pid in self.proposal_ids:"""
props_new = """    def fetch_all_proposals(self, offset: int = 0, limit: int = 50) -> str:
        \"\"\"
        Retrieves all proposals for external React/Next.js frontend consumption with Pagination.
        \"\"\"
        out = []
        total = len(self.proposal_ids)
        lim = min(max(int(limit), 1), 50)
        off = max(int(offset), 0)
        end = min(off + lim, total)
        for i in range(off, end):
            pid = self.proposal_ids[i]"""
code = code.replace(props_old, props_new)

with open('contracts/PoWLendingProtocol.py', 'w', encoding='utf-8') as f:
    f.write(code)

print("Pagination injected successfully!")
