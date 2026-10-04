import * as findings from '../../../../shared/engine/checks/helpers/findings.mjs';

const DECLARED = /(^|\/)declared-checks\.json$/;
const BOUNDARY = '(?:^|[;&|\\n])';

const rule = {
  id: 'anchored-bash-guards',
  on_fail: 'block',
  since: '2026-10-04',
  description: 'Every Bash `guardToolCalls` match starts at a command boundary',
  why: 'an unanchored pattern also fires when the command text is merely quoted in an argument (a --summary or a commit message), blocking a call that never ran the guarded command',

  run(ctx) {
    const out = [];
    for (const file of ctx.files.filter((f) => DECLARED.test(f))) {
      const text = ctx.read(file);
      if (text === null) continue;
      let specs;
      try { specs = JSON.parse(text); } catch { continue; }
      if (!Array.isArray(specs)) continue;
      for (const spec of specs) {
        if (!spec || spec.scope !== 'action' || !Array.isArray(spec.guardToolCalls)) continue;
        for (const guard of spec.guardToolCalls) {
          if (guard?.tool !== 'Bash' || typeof guard.match !== 'string') continue;
          if (guard.match.includes(BOUNDARY)) continue;
          out.push(findings.finding(rule, {
            file,
            line: text.slice(0, text.indexOf(`"${spec.id}"`)).split('\n').length,
            what: `"${spec.id}" matches Bash commands with ${guard.match.slice(0, 60)}, which is not anchored to a command boundary`,
            fix: `begin the pattern with ${BOUNDARY}\\s* so it matches only where a command starts`,
          }));
        }
      }
    }
    return out;
  },
};

export default rule;
