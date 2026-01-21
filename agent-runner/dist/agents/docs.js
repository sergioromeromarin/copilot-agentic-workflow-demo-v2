import { canWrite } from '../policy.js';
import { writeText } from '../tools/fs.js';
export async function runDocsAgent(policy, repoRoot, receivedHandoffs = []) {
    const findings = [
        { level: 'info', code: 'docs.todo', message: 'Docs agent placeholder (can update README/demo docs in elevated fix/both).' }
    ];
    if (receivedHandoffs.length > 0) {
        findings.push({ level: 'info', code: 'docs.handoffs.received', message: `Received ${receivedHandoffs.length} handoff task(s).` });
        if (canWrite(policy)) {
            const path = 'docs/agent-handoffs.md';
            const content = [
                '# Agent handoffs',
                '',
                ...receivedHandoffs.map(h => `- **${h.title}** → ${h.goal}`)
            ].join('\n');
            try {
                await writeText(policy, repoRoot, path, content);
                findings.push({ level: 'info', code: 'docs.handoffs.written', message: `Wrote ${path}` });
            }
            catch (e) {
                findings.push({ level: 'warn', code: 'docs.handoffs.write_failed', message: String(e?.message ?? e) });
            }
        }
    }
    return {
        name: 'docs',
        summary: 'Docs checks completed',
        findings,
        proposedEdits: [],
        commands: [],
        artifacts: [],
        receivedHandoffs
    };
}
