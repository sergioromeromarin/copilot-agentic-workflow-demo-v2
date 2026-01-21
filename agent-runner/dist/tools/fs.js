import fs from 'node:fs/promises';
import path from 'node:path';
function normalize(p) {
    return p.replace(/\\/g, '/');
}
function globToRegExp(glob) {
    // Minimal glob: **, *
    const escaped = glob
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*\//g, '(?:.*?/)?')
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*');
    return new RegExp(`^${escaped}$`);
}
function matchesAny(p, globs) {
    const n = normalize(p);
    return globs.some(g => globToRegExp(g).test(n));
}
export function canWritePath(policy, relativePath) {
    if (policy.mode !== 'elevated')
        return false;
    const allowed = matchesAny(relativePath, policy.allowedWriteGlobs);
    const denied = matchesAny(relativePath, policy.deniedWriteGlobs);
    return allowed && !denied;
}
export async function readText(repoRoot, relativePath) {
    const abs = path.join(repoRoot, relativePath);
    return await fs.readFile(abs, 'utf8');
}
export async function writeText(policy, repoRoot, relativePath, content) {
    if (!canWritePath(policy, relativePath)) {
        throw new Error(`Write denied by policy for path: ${relativePath}`);
    }
    const abs = path.join(repoRoot, relativePath);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content, 'utf8');
}
