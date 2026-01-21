---
id: unit-tests
title: Unit Tests
handoff_to: [docs]
requires:
  exec: true
  write: true
---

# Unit tests agent

## Task
- In elevated tests/both: run `dotnet test` and write logs under `artifacts/agent/`.
- In elevated fix/both: optionally generate/adjust test files under `CopilotDemo.Api.v2.Tests/`.

## Inputs
You may receive a handoff task describing what to focus on.

## Handoff Rules
- If tests fail, tell docs agent how to reproduce locally.

