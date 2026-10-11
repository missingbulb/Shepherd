// The pack's guard checks as cn enforces them: a Bash call fed to the
// pinned engine's pre-tool-use hook, and the ids of the checks that block it.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../../../../', import.meta.url));
const CN = join(ROOT, '.claudinite', 'bin', 'cn');

export function blockedBy(command) {
  const input = JSON.stringify({ session_id: 'test', hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command } });
  const r = spawnSync(CN, ['hook', 'pre-tool-use'], { cwd: ROOT, input, encoding: 'utf8' });
  if (r.error) throw new Error(`${CN} did not run (sh .claudinite/launch version installs it): ${r.error.message}`);
  if (r.status !== 0 && r.status !== 2) throw new Error(`cn hook pre-tool-use exited ${r.status}: ${r.stderr}`);
  return [...r.stderr.matchAll(/^Blocked by ([\w-]+):/gm)].map((m) => m[1]);
}
