import path from 'node:path';
import fs from 'node:fs/promises';
import * as core from '@actions/core';
import { runOrchestrator } from './orchestrator.js';
import { toMarkdown } from './reporting/report.js';
import { upsertComment } from './github/pr.js';

async function main(): Promise<void> {
  const repoRoot = process.cwd();
  const result = await runOrchestrator(repoRoot);

  const artifactDir = process.env.AGENT_ARTIFACT_DIR ?? 'artifacts/agent';
  const reportMd = path.join(repoRoot, artifactDir, 'report.md');
  const reportJson = path.join(repoRoot, artifactDir, 'report.json');

  const md = toMarkdown(result);
  await fs.mkdir(path.dirname(reportMd), { recursive: true });
  await fs.writeFile(reportMd, md, 'utf8');
  await fs.writeFile(reportJson, JSON.stringify(result, null, 2), 'utf8');

  const runUrl = process.env.GITHUB_RUN_ID && process.env.GITHUB_REPOSITORY
    ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : '';

  const marker = '<!-- agentic-runner-comment -->';
  const commentBody = [
    marker,
    `## Agentic Report (PR #${result.pr.number})`,
    '',
    result.executiveSummary?.trim() ? result.executiveSummary.trim() : 'Reporte generado (sin resumen LLM).',
    '',
    runUrl ? `Run: ${runUrl}` : '',
    '',
    `Artifacts: \`${artifactDir}\``
  ].filter(Boolean).join('\n');

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    await upsertComment(result.pr, token, commentBody, marker);
  }

  core.setOutput('report_md', reportMd);
  core.setOutput('report_json', reportJson);
}

main().catch(err => {
  core.setFailed(String(err?.stack ?? err));
});
