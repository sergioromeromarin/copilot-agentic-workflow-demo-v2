export async function runFrontendAgent(policy, repoRoot, receivedHandoffs = []) {
    const findings = [
        { level: 'info', code: 'frontend.todo', message: 'Frontend agent placeholder (can add npm build checks later).' }
    ];
    if (receivedHandoffs.length > 0) {
        findings.push({ level: 'info', code: 'frontend.handoffs.received', message: `Received ${receivedHandoffs.length} handoff task(s).` });
    }
    return {
        name: 'frontend',
        summary: 'Frontend checks completed',
        findings,
        proposedEdits: [],
        commands: [],
        artifacts: [],
        receivedHandoffs
    };
}
