# Agentic Report (PR #1)

- Started: 2026-01-21T23:10:32.096Z
- Finished: 2026-01-21T23:10:32.123Z
- Mode: readonly (tests)

## Executive summary
No summary generated.

## Checks matrix
| Agent | Errors | Warnings | Info | Summary |
|---|---:|---:|---:|---|
| backend | 0 | 0 | 1 | Backend checks OK/limited |
| frontend | 0 | 0 | 1 | Frontend checks completed |
| qa-integration | 0 | 0 | 1 | QA integration checks completed |
| docs | 0 | 0 | 1 | Docs checks completed |
| unit-tests | 0 | 2 | 2 | Unit test generator completed |

## Findings
### backend
- **INFO** `backend.build.skipped`: Exec disabled by policy (or no AGENT_EXEC prefixes).

**Outgoing handoffs**
- To **unit-tests**: **Run dotnet tests (if allowed)** (goal: If in elevated tests/both, run dotnet test and capture logs)

### frontend
- **INFO** `frontend.todo`: Frontend agent placeholder (can add npm build checks later).

### qa-integration
- **INFO** `qa.smoke.skipped`: QA smoke checks skipped in read-only mode.

### docs
- **INFO** `docs.todo`: Docs agent placeholder (can update README/demo docs in elevated fix/both).

### unit-tests
- **WARN** `tests.sln.missing`: Solution file not found: copilot-agentic-workflow-demo-v2.sln
- **WARN** `tests.project.missing`: Test project not found: CopilotDemo.Api.v2.Tests/CopilotDemo.Api.v2.Tests.csproj
- **INFO** `tests.generated.skipped`: Skipping test generation (write disabled by policy).
- **INFO** `tests.dotnet.skipped`: Skipping dotnet test (exec disabled by policy).

## Proposed edits
- None
