import { AgentMode, ElevatedMode, ToolPolicy } from './types.js';

export function buildPolicyFromEnv(): ToolPolicy {
  const mode = (process.env.AGENT_MODE ?? 'readonly') as AgentMode;
  const elevatedMode = (process.env.AGENT_ELEVATED_MODE ?? 'tests') as ElevatedMode;

  const allowedExecPrefixes = (process.env.AGENT_EXEC ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return {
    mode,
    elevatedMode,
    allowedWriteGlobs: [
      'CopilotDemo.Api.v2/**',
      'dragonball-client/**',
      'CopilotDemo.Api.v2.Tests/**',
      'artifacts/**',
      'docs/**',
      'README.md'
    ],
    deniedWriteGlobs: [
      '**/bin/**',
      '**/obj/**',
      '**/node_modules/**',
      '**/.git/**'
    ],
    allowedExecPrefixes,
    maxExecMs: Number(process.env.AGENT_MAX_EXEC_MS ?? 180_000),
    maxConcurrency: Number(process.env.AGENT_MAX_CONCURRENCY ?? 3)
  };
}

export function canWrite(policy: ToolPolicy): boolean {
  if (policy.mode !== 'elevated') return false;
  return policy.elevatedMode === 'fix' || policy.elevatedMode === 'both';
}

export function canExec(policy: ToolPolicy): boolean {
  if (policy.mode !== 'elevated') return false;
  return policy.elevatedMode === 'tests' || policy.elevatedMode === 'both';
}
