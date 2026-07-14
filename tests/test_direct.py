import pytest
import os
import sys

# Add contracts dir to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "contracts")))

def test_deployment_local(genlayer_mock):
    # This automatically invokes the LLM mock from gltest
    pass
