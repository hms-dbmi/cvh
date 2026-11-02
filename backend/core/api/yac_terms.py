"""The YAC beta terms people accept when they request access.

Change TERMS_VERSION whenever the text changes: each request records the
version it accepted (YacAccessRequest.terms_version).
"""

# Placeholder until the real terms are drafted; replace before launch.
TERMS_VERSION = "draft-1"

TERMS = """\
PLACEHOLDER: these terms are a draft and will be replaced before launch.

YAC is a beta feature of the Community Visualization Hub (CVH) that answers \
questions about Common Fund Data Ecosystem (cfdb) metadata with charts.

- Your questions, and descriptions of the cfdb data, are sent to an AI model \
provider to produce answers.
- Questions and answers are recorded to monitor and improve YAC.
- Answers can be wrong. Check results before relying on them.
- Usage is limited each month, and access can change or end during the beta.
"""
