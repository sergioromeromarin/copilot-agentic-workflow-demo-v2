import { exec } from './exec.js';
import { ToolPolicy } from '../types.js';

export async function gitDiffNameOnly(policy: ToolPolicy, repoRoot: string, baseRef: string, headRef: string): Promise<string[]> {
  const res = await exec(policy, `git diff --name-only ${baseRef}...${headRef}`, repoRoot);
  if (res.exitCode !== 0) return [];
  return res.stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

export async function gitStatus(policy: ToolPolicy, repoRoot: string): Promise<string> {
  const res = await exec(policy, 'git status --porcelain', repoRoot);
  return res.stdout;
}
