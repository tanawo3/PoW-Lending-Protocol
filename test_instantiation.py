import sys
sys.path.append('contracts')

class MockGL:
    class evm:
        def contract_interface(cls):
            return cls
    class public:
        def view(func):
            return func
        class WriteDecorator:
            def __call__(self, func):
                return func
            def payable(self, func):
                return func
        write = WriteDecorator()
    class message:
        sender_address = "0x1234567890abcdef1234567890abcdef12345678"
    class nondet:
        def invoke(self):
            return "invoked"
    class contract:
        pass
    Contract = object

import builtins
builtins.gl = MockGL()
builtins.allow_storage = lambda x: x
def u256(val): return val
builtins.u256 = u256
class DynArray:
    def __init__(self): self.data = []
    def append(self, x): self.data.append(x)
builtins.DynArray = DynArray
class TreeMap:
    def __init__(self): self.data = {}
    def set(self, k, v): self.data[k] = v
    def get(self, k): return self.data.get(k)
builtins.TreeMap = TreeMap

class DummyModule: pass
import sys
genlayer_mod = DummyModule()
genlayer_mod.gl = builtins.gl
genlayer_mod.allow_storage = builtins.allow_storage
genlayer_mod.u256 = builtins.u256
genlayer_mod.DynArray = builtins.DynArray
genlayer_mod.TreeMap = builtins.TreeMap
sys.modules['genlayer'] = genlayer_mod

import PoWLendingProtocol
import logging

try:
    contract = PoWLendingProtocol.PoWLendingProtocol()
    print("Instantiation successful!")
except Exception as e:
    print(f"Instantiation failed: {e}")
    logging.exception(e)
