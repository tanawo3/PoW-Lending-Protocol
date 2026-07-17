import pytest
import sys
import builtins

sys.path.append('contracts')

class MockGL:
    class evm:
        def contract_interface(cls): return cls
    class public:
        def view(func): return func
        class WriteDecorator:
            def __call__(self, func): return func
            def payable(self, func): return func
        write = WriteDecorator()
    class message:
        sender_address = "0x1234567890abcdef1234567890abcdef12345678"
    class nondet:
        def invoke(self): return "invoked"
    class contract:
        pass
    class vm:
        class UserError(Exception): pass
    Contract = object

builtins.gl = MockGL()
builtins.allow_storage = lambda x: x
def u256(val): return val
builtins.u256 = u256

class DynArray:
    def __init__(self): self.data = []
    def append(self, x): self.data.append(x)
    def __len__(self): return len(self.data)
    def __getitem__(self, i): return self.data[i]
    def __setitem__(self, i, v): self.data[i] = v
    def __iter__(self): return iter(self.data)
builtins.DynArray = DynArray

class TreeMap:
    def __init__(self): self.data = {}
    def set(self, k, v): self.data[k] = v
    def get(self, k, default=None): return self.data.get(k, default)
    def __setitem__(self, k, v): self.data[k] = v
    def __getitem__(self, k): return self.data[k]
    def __contains__(self, k): return k in self.data
    def values(self): return self.data.values()
    def items(self): return self.data.items()
    def keys(self): return self.data.keys()
    def __len__(self): return len(self.data)
builtins.TreeMap = TreeMap

class DummyModule: pass
genlayer_mod = DummyModule()
genlayer_mod.gl = builtins.gl
genlayer_mod.allow_storage = builtins.allow_storage
genlayer_mod.u256 = builtins.u256
genlayer_mod.DynArray = builtins.DynArray
genlayer_mod.TreeMap = builtins.TreeMap
genlayer_mod.vm = MockGL.vm
sys.modules['genlayer'] = genlayer_mod

@pytest.fixture
def direct_vm():
    class DummyVM:
        sender = "0x1234567890abcdef1234567890abcdef12345678"
    return DummyVM()

@pytest.fixture
def direct_deploy():
    def _deploy(contract_path, *args, **kwargs):
        import PoWLendingProtocol
        return PoWLendingProtocol.PoWLendingProtocol()
    return _deploy

@pytest.fixture
def direct_owner():
    return "0x1234567890abcdef1234567890abcdef12345678"
