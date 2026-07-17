import pytest
import json

CONTRACT = "contracts/PoWLendingProtocol.py"

def test_deployment(direct_vm, direct_deploy, direct_owner):
    """
    Simulates a deployment of the PoW Lending Protocol using the GenLayer simulator.
    Ensures that the contract deploys without internal instantiation errors.
    """
    # Set the simulator context sender to the owner
    direct_vm.sender = direct_owner
    
    # Deploy the contract
    contract = direct_deploy(CONTRACT)
    
    # Simple view check to ensure state was initialized
    pools_json = contract.get_all_pools()
    assert pools_json == "[]"
    
    markets_json = contract.get_all_markets()
    assert markets_json == "[]"

def test_protocol_state(direct_vm, direct_deploy, direct_owner):
    """
    Checks that ProtocolState is initialized to ACTIVE and version is correct.
    """
    direct_vm.sender = direct_owner
    contract = direct_deploy(CONTRACT)
    
    # Get protocol state
    state_json = contract.get_protocol_state()
    state = json.loads(state_json)
    
    assert state.get("is_active") is True
    assert state.get("version") == "v2.5.0-Enterprise"
