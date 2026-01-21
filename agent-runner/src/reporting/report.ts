import { OrchestratorResult } from '../types.js';

export function toMarkdown(result: OrchestratorResult): string {
  const lines: string[] = [];
  lines.push(`# Agentic Report (PR #${result.pr.number})`);
  lines.push('');
  lines.push(`- Started: ${result.startedAt}`);
  lines.push(`- Finished: ${result.finishedAt}`);
  lines.push(`- Mode: ${result.policy.mode} (${result.policy.elevatedMode})`);
  lines.push('');
  lines.push('## Executive summary');
  lines.push(result.executiveSummary.trim() ? result.executiveSummary : 'No summary generated.');
  lines.push('');
  lines.push('## Checks matrix');
  lines.push('| Agent | Errors | Warnings | Info | Summary |');
  lines.push('|---|---:|---:|---:|---|');
  for (const r of result.results) {
    const errors = r.findings.filter(f => f.level === 'error').length;
    const warns = r.findings.filter(f => f.level === 'warn').length;
    const info = r.findings.filter(f => f.level === 'info').length;
    lines.push(`| ${r.name} | ${errors} | ${warns} | ${info} | ${escapePipes(r.summary)} |`);
  }
  lines.push('');

  lines.push('## Findings');
  for (const r of result.results) {
    lines.push(`### ${r.name}`);

    if (r.receivedHandoffs && r.receivedHandoffs.length > 0) {
      lines.push('**Received handoffs**');
      for (const h of r.receivedHandoffs) {
        lines.push(`- From workflow → **${h.title}** (goal: ${escapeMd(h.goal)})`);
      }
      lines.push('');
    }

    if (r.findings.length === 0) {
      lines.push('- No findings');
    } else {
      for (const f of r.findings) {
        lines.push('- **' + f.level.toUpperCase() + '** `' + f.code + '`: ' + escapeMd(f.message));
      }
    }

    if (r.handoffs && r.handoffs.length > 0) {
      lines.push('');
      lines.push('**Outgoing handoffs**');
      for (const h of r.handoffs) {
        lines.push(`- To **${escapeMd(h.to)}**: **${escapeMd(h.title)}** (goal: ${escapeMd(h.goal)})`);
      }
    }

    lines.push('');
  }

  lines.push('## Proposed edits');
  const edits = result.results.flatMap(r => r.proposedEdits.map(e => ({ agent: r.name, ...e })));
  if (edits.length === 0) {
    lines.push('- None');
  } else {
    for (const e of edits) {
      lines.push(`- ${e.path} (${e.agent}): ${escapeMd(e.reason)}`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

function escapePipes(s: string): string {
  return s.replace(/\|/g, '\\|');
}

function escapeMd(s: string): string {
  return s.replace(/\r?\n/g, ' ').trim();
}
