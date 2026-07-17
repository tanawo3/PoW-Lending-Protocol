import re

with open('contracts/PoWLendingProtocol.py', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add roles to type annotations
code = re.sub(r'owner: str\n    treasury_balance: u256', r'roles: TreeMap[str, str]\n    treasury_balance: u256', code)

# 2. Replace self.owner initialization with self.roles
code = re.sub(r'self\.owner = str\(gl\.message\.sender_address\)', r'self.roles = TreeMap()\n        self.roles[str(gl.message.sender_address)] = "ADMIN"', code)

# 3. Add grant_role and revoke_role methods at the end of __init__ block
init_end_idx = code.find('def deposit_treasury(')
rbac_funcs = '''
    @gl.public.write
    def grant_role(self, account: str, role: str) -> bool:
        """Grants an RBAC role to an account (DAO Governance)."""
        if self.roles.get(str(gl.message.sender_address)) != "ADMIN":
            raise gl.vm.UserError("Unauthorized: Must be ADMIN to grant roles")
        self.roles[account] = role.upper()
        return True

    @gl.public.write
    def revoke_role(self, account: str) -> bool:
        """Revokes all roles from an account."""
        if self.roles.get(str(gl.message.sender_address)) != "ADMIN":
            raise gl.vm.UserError("Unauthorized: Must be ADMIN to revoke roles")
        self.roles[account] = "NONE"
        return True

    '''
code = code[:init_end_idx] + rbac_funcs + code[init_end_idx:]

# 4. Replace owner checks with RBAC ADMIN checks
code = re.sub(r'if str\(gl\.message\.sender_address\) != self\.owner:', r'if self.roles.get(str(gl.message.sender_address)) != "ADMIN":', code)
code = re.sub(r'if str\(gl\.message\.sender_address\) != prop\.borrower and str\(gl\.message\.sender_address\) != self\.owner:', r'if str(gl.message.sender_address) != prop.borrower and self.roles.get(str(gl.message.sender_address)) != "ADMIN":', code)

with open('contracts/PoWLendingProtocol.py', 'w', encoding='utf-8') as f:
    f.write(code)

print('RBAC Successfully injected!')
