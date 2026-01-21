import fs from 'node:fs/promises';
export async function getPullRequestRef() {
    let repoEnv = process.env.GITHUB_REPOSITORY;
    let owner, repo;
    if (!repoEnv) {
        // fallback for local/dev: use demo values
        owner = 'demo';
        repo = 'repo';
    }
    else {
        [owner, repo] = repoEnv.split('/');
        if (!owner || !repo)
            throw new Error(`Invalid GITHUB_REPOSITORY: ${repoEnv}`);
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
        const evt = JSON.parse(raw);
        const number = evt?.pull_request?.number;
        if (!number)
            throw new Error('No PR number in event');
        return { owner, repo, number };
    }
    catch {
        return { owner, repo, number: 1 };
    }
}
