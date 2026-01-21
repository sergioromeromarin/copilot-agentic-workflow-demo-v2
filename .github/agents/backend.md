---
id: backend
title: Backend Checks
handoff_to: [unit-tests, docs]
requires:
  exec: true
  write: false
---

# Backend agent

## Task
- Validate the backend builds.
- Report failures with a clear error code.

## Handoff Rules
- If build fails, request unit-tests agent to run tests and capture logs.
- Always provide docs agent a short note about what happened.

## Output Contract (JSON)
```json
{
  "schema_version": 1,
  "agent_id": "backend",
  "handoffs": [{ "to": "unit-tests", "title": "Run tests", "goal": "Run dotnet test and capture logs" }]
}
```

