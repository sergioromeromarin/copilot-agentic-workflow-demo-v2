import fs from 'node:fs/promises';
import { PullRequestRef } from '../types.js';

export async function getPullRequestRef(): Promise<PullRequestRef> {
  let repoEnv = process.env.GITHUB_REPOSITORY;
  let owner: string, repo: string;
  if (!repoEnv) {
    // fallback for local/dev: use demo values
    owner = 'demo';
    repo = 'repo';
  } else {
    [owner, repo] = repoEnv.split('/');
    if (!owner || !repo) throw new Error(`Invalid GITHUB_REPOSITORY: ${repoEnv}`);
  }

  const prFromEnv = process.env.AGENT_PR_NUMBER;
  if (prFromEnv) {
    return { owner, repo, number: Number(prFromEnv) };
  }

  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    // fallback for local/dev: use demo PR number
    return { owner, repo, number: 1 };
  }

  try {
    const raw = await fs.readFile(eventPath, 'utf8');
    const evt = JSON.parse(raw) as any;
    const number = evt?.pull_request?.number;
    if (!number) throw new Error('No PR number in event');
    return { owner, repo, number };
  } catch {
    return { owner, repo, number: 1 };
  }
}
