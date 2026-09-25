// shepherd — this repo's own rules: the ones that are true here and portable nowhere.
// A lesson that would hold in another repo belongs in a canon pack instead.
// worldRules is discovered from worldRules/*.mjs, so it is not listed here.
export default {
  id: 'shepherd',
  version: 1,
  ruleRoutingGuidance: {
    belongs: 'working rules and lessons specific to this repository and not portable to any other',
    excludes: 'anything true beyond this repo — that belongs in a canon pack, proposed upstream',
  },
  detect: null,
  marker: null,
  prose: 'RULES.md',
};
