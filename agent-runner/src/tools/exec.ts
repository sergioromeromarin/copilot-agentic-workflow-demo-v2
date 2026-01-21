import { spawn } from 'node:child_process';
import { canExec } from '../policy.js';
import { ToolPolicy } from '../types.js';

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

function isAllowedCommand(policy: ToolPolicy, cmd: string): boolean {
  if (policy.allowedExecPrefixes.length === 0) return false;
  const first = cmd.trim().split(/\s+/)[0] ?? '';
  return policy.allowedExecPrefixes.some(p => p === first);
}

export async function exec(policy: ToolPolicy, cmd: string, cwd: string): Promise<ExecResult> {
  if (!canExec(policy)) {
    throw new Error(`Exec disabled by policy (mode=${policy.mode}, elevatedMode=${policy.elevatedMode})`);
  }

  if (!isAllowedCommand(policy, cmd)) {
    throw new Error(`Command not allowed by policy: ${cmd}`);
  }

  const start = Date.now();

  return await new Promise<ExecResult>((resolve, reject) => {
    const child = spawn(cmd, {
      cwd,
      shell: true,
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Command timed out after ${policy.maxExecMs}ms: ${cmd}`));
    }, policy.maxExecMs);

    child.stdout.on('data', (d) => (stdout += String(d)));
    child.stderr.on('data', (d) => (stderr += String(d)));

    child.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
        durationMs: Date.now() - start
      });
    });
  });
}
