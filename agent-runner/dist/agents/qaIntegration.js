export async function runQaIntegrationAgent(policy, repoRoot, receivedHandoffs = []) {
    const findings = [];
    if (receivedHandoffs.length > 0) {
        findings.push({ level: 'info', code: 'qa.handoffs.received', message: `Received ${receivedHandoffs.length} handoff task(s).` });
    }
    // Placeholder: keep stable in CI; elevated workflow can extend this to start API and call /health.
    if (policy.mode === 'elevated' && (policy.elevatedMode === 'tests' || policy.elevatedMode === 'both')) {
        findings.push({ level: 'info', code: 'qa.smoke.todo', message: 'QA smoke checks enabled (implementation placeholder).' });
    }
    else {
        findings.push({ level: 'info', code: 'qa.smoke.skipped', message: 'QA smoke checks skipped in read-only mode.' });
    }
    return {
        name: 'qa-integration',
        summary: 'QA integration checks completed',
        findings,
        proposedEdits: [],
        commands: [],
        artifacts: [],
        receivedHandoffs
    };
}
