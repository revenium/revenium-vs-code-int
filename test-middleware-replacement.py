# Test: Verify middleware replacement logic

# BEFORE (what users write):
from openai import OpenAI
client = OpenAI(api_key="sk-test")

# AFTER (what extension should transform to):
# from revenium_middleware_openai_python import OpenAI
# client = OpenAI(api_key="sk-test")

# The quick fix should REPLACE the import, not add alongside