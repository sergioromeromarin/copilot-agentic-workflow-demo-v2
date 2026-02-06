import path from 'node:path';
import fs from 'node:fs/promises';
import { buildPolicyFromEnv } from './policy.js';
import { getPullRequestRef } from './github/context.js';
import { getPullRequestFiles } from './github/pr.js';
import { runBackendAgent } from './agents/backend.js';
import { runFrontendAgent } from './agents/frontend.js';
import { runQaIntegrationAgent } from './agents/qaIntegration.js';
import { runDocsAgent } from './agents/docs.js';
import { runUnitTestGenerator } from './agents/unitTestGenerator.js';
import { summarizeWithLLM } from './llm.js';
/**
 * Agent Orchestrator - The Heart of the Custom Runner System
 *
 * WHY WE BUILT THIS INSTEAD OF USING NATIVE GITHUB COPILOT:
 *
 * 1. PARALLEL MULTI-AGENT EXECUTION
 *    - Runs 5 specialized agents concurrently (Backend, Frontend, QA, Docs, Tests)
 *    - Each agent is a domain expert with focused responsibilities
 *    - Native Copilot: Single-context, sequential interactions only
 *
 * 2. POLICY-BASED SECURITY
 *    - Readonly mode: Agents can analyze but not modify (default for PRs)
 *    - Elevated mode: Agents can execute tests and apply fixes (manual approval required)
 *    - Native Copilot: No programmatic policy enforcement
 *
 * 3. AUTOMATED CI/CD INTEGRATION
 *    - Triggers on PR events without human intervention
 *    - Integrates with GitHub Actions workflows
 *    - Generates structured reports (JSON, Markdown)
 *    - Posts findings as PR comments automatically
 *    - Native Copilot: Requires manual IDE interaction
 *
 * 4. CROSS-AGENT COORDINATION
 *    - Agents can hand off tasks to each other
 *    - Results are aggregated and summarized by LLM
 *    - Findings are categorized and prioritized
 *    - Native Copilot: No inter-agent communication
 *
 * 5. CUSTOMIZABLE WORKFLOW
 *    - Project-specific tools (dotnet, npm, git)
 *    - Domain-specific analysis logic
 *    - Configurable concurrency and execution order
 *    - Native Copilot: Fixed workflow, limited customization
 *
 * 6. COMPREHENSIVE REPORTING
 *    - Structured findings with severity levels
 *    - Test results and logs as artifacts
 *    - Executive summaries in Spanish (or any language)
 *    - Native Copilot: Chat-based output, not structured
 *
 * This orchestrator enables autonomous, parallel, policy-controlled agent execution
 * in CI/CD pipelines - something native GitHub Copilot cannot provide.
 */
async function ensureDir(p) {
    await fs.mkdir(p, { recursive: true });
}
async function runParallel(maxConcurrency, tasks) {
    const results = [];
    let index = 0;
    async function worker() {
        while (true) {
            const i = index++;
            if (i >= tasks.length)
                return;
            results[i] = await tasks[i]();
        }
    }
    const workers = Array.from({ length: Math.min(maxConcurrency, tasks.length) }, () => worker());
    await Promise.all(workers);
    return results;
}
export async function runOrchestrator(repoRoot) {
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
