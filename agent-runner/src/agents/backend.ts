import { AgentResult, Finding, HandoffTask, ToolPolicy } from '../types.js';
import { canExec } from '../policy.js';
import { exec } from '../tools/exec.js';

export async function runBackendAgent(policy: ToolPolicy, repoRoot: string, receivedHandoffs: HandoffTask[] = []): Promise<AgentResult> {
  const findings: Finding[] = [];
  const commands: Array<{ cmd: string; reason: string }> = [];
  const artifacts: Array<{ path: string; description: string }> = [];
  const handoffs: HandoffTask[] = [];

  if (receivedHandoffs.length > 0) {
    findings.push({ level: 'info', code: 'backend.handoffs.received', message: `Received ${receivedHandoffs.length} handoff task(s).` });
  }

  const csproj = 'CopilotDemo.Api.v2/CopilotDemo.Api.v2.csproj';

  if (canExec(policy) && policy.allowedExecPrefixes.length > 0) {
    commands.push({ cmd: `dotnet build ${csproj}`, reason: 'Validate backend builds' });
    try {
      const res = await exec(policy, `dotnet build ${csproj}`, repoRoot);
      if (res.exitCode !== 0) {
        findings.push({ level: 'error', code: 'backend.build.failed', message: 'dotnet build failed', details: { exitCode: res.exitCode } });
        artifacts.push({ path: 'artifacts/agent/logs/backend-build.log', description: 'dotnet build output' });

        handoffs.push({
          to: 'unit-tests',
          title: 'Run dotnet tests',
          goal: 'Run dotnet test and capture logs for failing build context',
          inputs: { focus_paths: ['CopilotDemo.Api.v2/'] },
          constraints: { noWrite: false, noExec: false }
        });

        handoffs.push({
          to: 'docs',
          title: 'Document build failure',
          goal: 'Add a short note on how to reproduce build/test failures locally',
          constraints: { noWrite: false, noExec: true }
        });
      } else {
        findings.push({ level: 'info', code: 'backend.build.ok', message: 'dotnet build succeeded' });
      }
    } catch (e: any) {
      findings.push({ level: 'error', code: 'backend.build.error', message: String(e?.message ?? e) });

      handoffs.push({
        to: 'unit-tests',
        title: 'Run dotnet tests',
        goal: 'Run dotnet test and capture logs to help diagnose backend build errors',
        inputs: { focus_paths: ['CopilotDemo.Api.v2/'] },
        constraints: { noWrite: false, noExec: false }
      });
    }
  } else {
    findings.push({ level: 'info', code: 'backend.build.skipped', message: 'Exec disabled by policy (or no AGENT_EXEC prefixes).' });

    handoffs.push({
      to: 'unit-tests',
      title: 'Run dotnet tests (if allowed)',
      goal: 'If in elevated tests/both, run dotnet test and capture logs',
      constraints: { noWrite: false, noExec: false }
    });
  }

  const summary = findings.some(f => f.level === 'error')
    ? 'Backend checks found errors'
    : 'Backend checks OK/limited';

  return {
    name: 'backend',
    summary,
    findings,
    proposedEdits: [],
    commands,
    artifacts,
    handoffs,
    receivedHandoffs
  };
}
