export function buildPolicyFromEnv() {
    const mode = (process.env.AGENT_MODE ?? 'readonly');
    const elevatedMode = (process.env.AGENT_ELEVATED_MODE ?? 'tests');
    const allowedExecPrefixes = (process.env.AGENT_EXEC ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    return {
        mode,
        elevatedMode,
        allowedWriteGlobs: [
            'CopilotDemo.Api.v2/**',
            'dragonball-client/**',
            'CopilotDemo.Api.v2.Tests/**',
            'artifacts/**',
            'docs/**',
            'README.md'
        ],
        deniedWriteGlobs: [
            '**/bin/**',
            '**/obj/**',
            '**/node_modules/**',
            '**/.git/**'
        ],
        allowedExecPrefixes,
        maxExecMs: Number(process.env.AGENT_MAX_EXEC_MS ?? 180_000),
        maxConcurrency: Number(process.env.AGENT_MAX_CONCURRENCY ?? 3)
    };
}
export function canWrite(policy) {
    if (policy.mode !== 'elevated')
        return false;
    return policy.elevatedMode === 'fix' || policy.elevatedMode === 'both';
}
export function canExec(policy) {
    if (policy.mode !== 'elevated')
        return false;
    return policy.elevatedMode === 'tests' || policy.elevatedMode === 'both';
}
