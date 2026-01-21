export type AgentMode = 'readonly' | 'elevated';
export type ElevatedMode = 'tests' | 'fix' | 'both';

export interface RepoRef {
  owner: string;
  repo: string;
}

export interface PullRequestRef extends RepoRef {
  number: number;
}

export interface ToolPolicy {
  mode: AgentMode;
  elevatedMode: ElevatedMode;
  allowedWriteGlobs: string[];
  deniedWriteGlobs: string[];
  allowedExecPrefixes: string[];
  maxExecMs: number;
  maxConcurrency: number;
}

export interface Finding {
  level: 'info' | 'warn' | 'error';
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ProposedEdit {
  path: string;
  reason: string;
  contents?: string;
  patch?: string;
}

export interface HandoffTask {
  to: string;
  title: string;
  goal: string;
  inputs?: Record<string, unknown>;
  constraints?: {
    noWrite?: boolean;
    noExec?: boolean;
  };
}

export interface AgentResult {
  name: string;
  summary: string;
  findings: Finding[];
  proposedEdits: ProposedEdit[];
  commands: Array<{ cmd: string; reason: string; }>
  artifacts: Array<{ path: string; description: string }>;
  receivedHandoffs?: HandoffTask[];
  handoffs?: HandoffTask[];
}

export interface OrchestratorResult {
  pr: PullRequestRef;
  startedAt: string;
  finishedAt: string;
  policy: ToolPolicy;
  results: AgentResult[];
  executiveSummary: string;
}
