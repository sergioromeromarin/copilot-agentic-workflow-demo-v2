# Agent Runner - Custom Orchestration System

## Why a Custom Runner Instead of Native GitHub Copilot?

This project implements a **custom agent orchestration system** instead of relying solely on GitHub Copilot's native capabilities. This document explains the architectural rationale behind this decision.

---

## 🎯 Core Rationale

### 1. **Multi-Agent Orchestration**
The custom runner enables **parallel execution of specialized agents**, each focusing on a specific domain:

- **Backend Agent**: Analyzes C# .NET code changes
- **Frontend Agent**: Reviews React/TypeScript client code
- **QA/Integration Agent**: Validates integration points
- **Documentation Agent**: Ensures docs are up-to-date
- **Unit Test Generator**: Creates and runs automated tests

**Native Limitation**: GitHub Copilot Workspace focuses on single-context code generation, not coordinated multi-agent workflows.

### 2. **Policy-Based Execution Control**
The runner implements a **policy system** that controls what actions agents can perform:

```typescript
interface ToolPolicy {
  canWrite: boolean;      // Can modify files?
  canExec: boolean;       // Can execute commands?
  maxConcurrency: number; // How many agents run in parallel?
}
```

**Benefit**: Different environments (readonly PR reviews vs. elevated fix mode) can safely execute agents with appropriate permissions.

**Native Limitation**: GitHub Copilot doesn't provide granular policy controls for automated agent execution.

### 3. **CI/CD Integration & Automation**
The runner is designed for **automated execution in GitHub Actions**:

- Triggers on PR events (opened, synchronized, reopened)
- Runs without human intervention
- Generates structured reports (Markdown, JSON)
- Posts findings as PR comments
- Uploads artifacts for analysis

**Native Limitation**: GitHub Copilot requires manual invocation and doesn't natively integrate into automated CI/CD pipelines.

### 4. **Customized Workflow Logic**
The orchestrator implements **custom business logic**:

```typescript
// Custom handoff system between agents
export interface HandoffTask {
  fromAgent: string;
  toAgent: string;
  task: string;
  priority: 'low' | 'medium' | 'high';
}
```

- Agents can hand off tasks to each other
- Results are aggregated and summarized
- LLM-powered executive summaries in Spanish
- Domain-specific code analysis

**Native Limitation**: GitHub Copilot doesn't support complex inter-agent communication or custom workflow orchestration.

### 5. **Environment Flexibility**
The runner works in **multiple execution contexts**:

- ✅ **Local Development**: Run without GitHub token for testing
- ✅ **GitHub Actions**: Automated execution on PRs
- ✅ **Readonly Mode**: Safe analysis without modifications
- ✅ **Elevated Mode**: Write access for automated fixes

**Native Limitation**: GitHub Copilot is primarily designed for interactive IDE usage.

### 6. **Specialized Tool Access**
Each agent has access to **custom tools** tailored to the project:

- `exec()`: Execute domain-specific commands (dotnet test, npm build)
- `readText()` / `writeText()`: Controlled file system access
- `getPullRequestFiles()`: GitHub API integration
- `summarizeWithLLM()`: OpenAI integration for insights

**Native Limitation**: GitHub Copilot has predefined tool sets that may not match project-specific needs.

### 7. **Auditability & Transparency**
The runner provides **comprehensive reporting**:

```typescript
export interface AgentResult {
  name: string;
  summary: string;
  findings: Finding[];          // All issues discovered
  proposedEdits: Edit[];        // Suggested code changes
  commands: Command[];          // Executed commands
  artifacts: Artifact[];        // Generated files
  receivedHandoffs: HandoffTask[]; // Tasks from other agents
}
```

- Every finding is categorized (info, warn, error)
- All agent actions are logged
- Results are aggregated into executive reports
- Test results are preserved as artifacts

**Native Limitation**: GitHub Copilot doesn't provide structured, programmatic access to analysis results.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              GitHub Actions Workflow                     │
│  (agentic-pr-readonly.yml / agentic-pr-elevated.yml)   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │  Orchestrator  │  ← Policy Configuration
         └───────┬────────┘
                 │
      ┌──────────┴──────────┐
      │  Parallel Execution  │
      └─────────┬────────────┘
                │
    ┌───────────┼───────────┬─────────────┬──────────┐
    ▼           ▼           ▼             ▼          ▼
┌────────┐ ┌──────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐
│Backend │ │ Frontend │ │   QA    │ │  Docs  │ │UnitTests │
│ Agent  │ │  Agent   │ │  Agent  │ │ Agent  │ │  Agent   │
└────┬───┘ └────┬─────┘ └────┬────┘ └───┬────┘ └────┬─────┘
     │          │            │           │           │
     └──────────┴────────────┴───────────┴───────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  LLM Summary    │
                  │  (Spanish)      │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Report & Post  │
                  │  to PR Comment  │
                  └─────────────────┘
```

---

## 📦 Key Components

### **1. Orchestrator** (`src/orchestrator.ts`)
- Coordinates agent execution
- Manages concurrency
- Aggregates results
- Generates executive summaries

### **2. Agents** (`src/agents/*.ts`)
- Specialized domain experts
- Follow common `AgentResult` interface
- Can read files, execute commands, generate reports
- Support handoff system for collaboration

### **3. Policy System** (`src/policy.ts`)
- Defines execution permissions
- Environment-based configuration
- Controls write/exec capabilities

### **4. GitHub Integration** (`src/github/*.ts`)
- PR context extraction
- File change detection
- Comment posting
- API interactions

### **5. Tools** (`src/tools/*.ts`)
- File system operations
- Command execution
- Git operations

---

## 🚀 Usage Modes

### **Readonly Mode** (Automated)
- Triggers on every PR event
- Analyzes code changes
- Reports findings
- **No modifications** to codebase
- Safe for continuous analysis

### **Elevated Mode** (Manual Approval)
- Requires `workflow_dispatch` trigger
- Can execute tests (`dotnet test`, `npm test`)
- Can generate test files
- Can apply automated fixes
- Requires environment protection

---

## 🔄 Workflow Execution

1. **PR Event** → Triggers GitHub Actions workflow
2. **Setup** → Install Node.js, .NET, dependencies
3. **Build** → Compile TypeScript to JavaScript
4. **Execute** → Run `node dist/index.js`
5. **Orchestrator** → Launches parallel agents with policy
6. **Agents** → Analyze, test, document, report
7. **Summarize** → LLM generates executive summary
8. **Report** → Post findings as PR comment
9. **Artifacts** → Upload reports, logs, test results

---

## 📊 Example Output

The runner generates structured reports:

```markdown
## Agentic Report (PR #42)

### Executive Summary
Los agentes han analizado 5 archivos modificados. 
Backend: Sin problemas detectados.
Frontend: 2 mejoras sugeridas en componentes React.
Tests: 12 tests pasaron exitosamente.

Artifacts: `artifacts/agent`
```

---

## 🎓 When to Use Native vs. Custom Runner

| Use Case | Native Copilot | Custom Runner |
|----------|----------------|---------------|
| Interactive code completion | ✅ Best choice | ❌ Not designed for this |
| Code suggestions in IDE | ✅ Best choice | ❌ Not designed for this |
| Automated PR analysis | ⚠️ Manual only | ✅ Best choice |
| Multi-agent orchestration | ❌ Not supported | ✅ Best choice |
| CI/CD integration | ❌ Not supported | ✅ Best choice |
| Policy-based execution | ❌ Not available | ✅ Best choice |
| Custom workflow logic | ❌ Limited | ✅ Best choice |
| Structured reporting | ❌ Limited | ✅ Best choice |

---

## 🔧 Local Development

```bash
# Build the runner
cd agent-runner
npm install
npm run build

# Run locally (readonly mode, no GitHub token required)
node dist/index.js

# Check generated reports
cat artifacts/agent/report.md
```

---

## 🛡️ Security Considerations

1. **Readonly Mode**: Default for all PRs, no write access
2. **Elevated Mode**: Requires environment approval in GitHub
3. **Policy System**: Prevents unauthorized operations
4. **Token Management**: GitHub tokens scoped appropriately
5. **Artifact Isolation**: Results stored in dedicated directories

---

## 📚 Related Documentation

- **PR Instructions**: See `/PR_INSTRUCTIONS.md`
- **Workflow Configuration**: See `.github/workflows/agentic-*.yml`
- **Agent Prompts**: See `.github/agents/*.md`

---

## 🏆 Summary

The custom agent runner provides:

✅ **Automation**: Runs on every PR without manual intervention  
✅ **Orchestration**: Coordinates multiple specialized agents  
✅ **Safety**: Policy-based execution control  
✅ **Flexibility**: Works locally and in CI/CD  
✅ **Transparency**: Comprehensive, structured reporting  
✅ **Extensibility**: Easy to add new agents or tools  

This level of control, automation, and customization is **not achievable with native GitHub Copilot alone**, which is why this project implements a custom runner system.
