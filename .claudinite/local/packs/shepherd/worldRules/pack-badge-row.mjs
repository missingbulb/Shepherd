import { finding } from '../../../../shared/engine/checks/helpers/findings.mjs';
import { BADGE_ROW_START, BADGE_ROW_END, README } from '../../../../shared/engine/converge-wiring.mjs';
import { LOCAL_PACKS_SUBDIR, SHARED_SUBDIR } from '../../../../shared/engine/pack_loader/pack-registry.mjs';

const rule = {
  id: 'pack-badge-row',
  severity: 'blocking',
  since: '2026-08-30',
  description: 'A declared pack with a badge.svg must have a matching badge in the README row',
  doc: '.claudinite/local/packs/shepherd/RULES.md',
  why: 'the badge row is a one-time seed the update flow never re-derives, so it silently goes stale on a pack rename, add, or remove — hit twice already (#67/#69, #79/#80/#81)',

  run(ctx) {
    const readme = ctx.read(README) ?? '';
    const start = readme.indexOf(BADGE_ROW_START);
    const end = readme.indexOf(BADGE_ROW_END);
    const row = start === -1 || end === -1 ? '' : readme.slice(start, end);

    return ctx.config.packs
      .filter((id) => ctx.exists(`${LOCAL_PACKS_SUBDIR}/${id}/badge.svg`) || ctx.exists(`${SHARED_SUBDIR}/packs/${id}/badge.svg`))
      .filter((id) => !row.includes(`![${id}]`))
      .map((id) => finding(rule, {
        file: README, line: null,
        what: `the "${id}" pack has a badge.svg but no matching badge in the README row`,
        fix: `run node .claudinite/shared/engine/converge-wiring.mjs <owner>/<repo> --badges to re-seed the row`,
      }));
  },
};

export default rule;
