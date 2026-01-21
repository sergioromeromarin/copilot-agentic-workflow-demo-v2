import path from 'node:path';
import fs from 'node:fs/promises';
import { buildPolicyFromEnv } from './policy.js';
import { OrchestratorResult, ToolPolicy } from './types.js';
import { getPullRequestRef } from './github/context.js';
import { getPullRequestFiles } from './github/pr.js';
import { runBackendAgent } from './agents/backend.js';
import { runFrontendAgent } from './agents/frontend.js';
import { runQaIntegrationAgent } from './agents/qaIntegration.js';
import { runDocsAgent } from './agents/docs.js';
import { runUnitTestGenerator } from './agents/unitTestGenerator.js';
import { summarizeWithLLM } from './llm.js';

async function ensureDir(p: string): Promise<void> {
  await fs.mkdir(p, { recursive: true });
}

async function runParallel<T>(maxConcurrency: number, tasks: Array<() => Promise<T>>): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = index++;
      if (i >= tasks.length) return;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(maxConcurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function runOrchestrator(repoRoot: string): Promise<OrchestratorResult> {
  const startedAt = new Date().toISOString();
  const policy = buildPolicyFromEnv();

  const token = process.env.GITHUB_TOKEN ?? '';

  const pr = await getPullRequestRef();
  const prFiles = await getPullRequestFiles(pr, token);

  const artifactDir = process.env.AGENT_ARTIFACT_DIR ?? 'artifacts/agent';
  const artifactAbs = path.join(repoRoot, artifactDir);
  await ensureDir(artifactAbs);
  await ensureDir(path.join(artifactAbs, 'logs'));

  const tasks = [
    () => runBackendAgent(policy, repoRoot, []),
    () => runFrontendAgent(policy, repoRoot, []),
    () => runQaIntegrationAgent(policy, repoRoot, []),
    () => runDocsAgent(policy, repoRoot, []),
    () => runUnitTestGenerator(policy, repoRoot, [])
  ];

  const results = await runParallel(policy.maxConcurrency, tasks);

  const findingsFlat = results.flatMap(r => r.findings.map(f => ({ agent: r.name, ...f })));
  const summary = await summarizeWithLLM([
    { role: 'system', content: 'You are a release engineer. Summarize agent findings for a PR in concise Spanish.' },
    { role: 'user', content: JSON.stringify({ pr, changedFiles: prFiles.map(f => f.filename).slice(0, 200), findings: findingsFlat }, null, 2) }
  ]);

  const finishedAt = new Date().toISOString();
  return {
    pr,
    startedAt,
    finishedAt,
    policy,
    results,
    executiveSummary: summary
  };
}
