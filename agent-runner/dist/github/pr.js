import * as github from '@actions/github';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
export async function getPullRequestFiles(pr, token) {
    if (!token || token === 'demo') {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const root = path.resolve(__dirname, '../../');
        async function listFiles(dir) {
            let results = [];
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                        results = results.concat(await listFiles(fullPath));
                    }
                    else if (!entry.name.startsWith('.')) {
                        results.push(path.relative(root, fullPath).replace(/\\/g, '/'));
                    }
                }
            }
            catch {
                // ignore errors on unreadable dirs
            }
            return results;
        }
        const demoFiles = [
            ...(await listFiles(path.join(root, 'CopilotDemo.Api.v2'))),
            ...(await listFiles(path.join(root, 'agent-runner/src')))
        ].filter(f => f.match(/\.(ts|cs|json|html|scss)$/));
        return demoFiles.map(f => ({ filename: f, status: 'modified' }));
    }
    const octokit = github.getOctokit(token);
    const files = [];
    let page = 1;
    while (true) {
        const res = await octokit.rest.pulls.listFiles({
            owner: pr.owner,
            repo: pr.repo,
            pull_number: pr.number,
            per_page: 100,
            page
        });
        for (const f of res.data) {
            files.push({ filename: f.filename, status: f.status, patch: f.patch });
        }
        if (res.data.length < 100)
            break;
        page++;
    }
    return files;
}
export async function upsertComment(pr, token, body, marker) {
    if (!token || token === 'demo') {
        console.log('[local mode] Would post comment:\n', body);
        return;
    }
    const octokit = github.getOctokit(token);
    const existing = await octokit.rest.issues.listComments({
        owner: pr.owner,
        repo: pr.repo,
        issue_number: pr.number,
        per_page: 100
    });
    const found = existing.data.find(c => (c.body ?? '').includes(marker));
    if (found) {
        await octokit.rest.issues.updateComment({
            owner: pr.owner,
            repo: pr.repo,
            comment_id: found.id,
            body
        });
        return;
    }
    await octokit.rest.issues.createComment({
        owner: pr.owner,
        repo: pr.repo,
        issue_number: pr.number,
        body
    });
}
