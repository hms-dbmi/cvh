import os

# udiagent validates its settings when cvh_yac imports the server. The tests
# never verify a token or call a model.
os.environ.setdefault("INSECURE_DEV_MODE", "1")
os.environ.setdefault("OPENAI_API_KEY", "test-not-used")
