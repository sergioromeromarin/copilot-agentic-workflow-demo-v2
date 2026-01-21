import { exec } from './exec.js';
export async function gitDiffNameOnly(policy, repoRoot, baseRef, headRef) {
    const res = await exec(policy, `git diff --name-only ${baseRef}...${headRef}`, repoRoot);
    if (res.exitCode !== 0)
        return [];
    return res.stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}
export async function gitStatus(policy, repoRoot) {
    const res = await exec(policy, 'git status --porcelain', repoRoot);
    return res.stdout;
}
