import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { runScenario as runConc01 } from './scenarios/conc01-create-attempt.mjs';
import { runScenario as runConc02 } from './scenarios/conc02-revision-race.mjs';
import { runScenario as runConc03 } from './scenarios/conc03-branch-race.mjs';

function normalizePath(p) {
  return p.replace(/\\/g, '/').toLowerCase();
}

function getRepoRoot() {
  const out = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    shell: false,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  }).trim();
  return normalizePath(out);
}

function getProjectId(repoRoot) {
  const configPath = resolve(repoRoot, 'supabase/config.toml');
  const config = readFileSync(configPath, 'utf8');
  const m = config.match(/project_id\s*=\s*"([^"]+)"/);
  if (!m) {
    throw new Error('LOCAL_TARGET_AMBIGUOUS: Could not parse project_id from supabase/config.toml');
  }
  return m[1];
}

export function discoverDatabaseContainer() {
  const repoRoot = getRepoRoot();
  const projectId = getProjectId(repoRoot);

  const psOut = execFileSync('docker', [
    'ps',
    '--filter', `label=com.supabase.cli.project=${projectId}`,
    '--format', '{{.ID}}'
  ], {
    shell: false,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  }).trim();

  if (!psOut) {
    throw new Error(`LOCAL_TARGET_AMBIGUOUS: No running containers found with label com.supabase.cli.project=${projectId}`);
  }

  const containerIds = psOut.split('\n').map(s => s.trim()).filter(Boolean);
  const matched = [];

  for (const cid of containerIds) {
    const raw = execFileSync('docker', ['inspect', cid], {
      shell: false,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const [insp] = JSON.parse(raw);
    const labels = insp.Config?.Labels || {};
    const name = insp.Name || '';
    const image = insp.Config?.Image || '';

    // Require com.supabase.cli.project to equal local config project_id
    if (labels['com.supabase.cli.project'] !== projectId) {
      continue;
    }

    // Verify com.supabase.cli.workdir when present
    if (labels['com.supabase.cli.workdir']) {
      const containerWorkdir = normalizePath(labels['com.supabase.cli.workdir']);
      if (containerWorkdir !== repoRoot) {
        continue;
      }
    }

    // Require service identification
    const service = labels['com.docker.compose.service'];
    const isDb = service ? (service === 'db') : (/\/postgres:[^/]+$/.test(image) || name === '/supabase_db_veclab');

    if (isDb) {
      matched.push({
        id: cid,
        name: name.replace(/^\//, ''),
        image,
        labels
      });
    }
  }

  if (matched.length !== 1) {
    throw new Error(`LOCAL_TARGET_AMBIGUOUS: Expected exactly 1 database container for project '${projectId}', found ${matched.length}`);
  }

  return matched[0];
}

export class Supervisor {
  constructor(containerName) {
    this.containerName = containerName;
    this.trackedPids = new Set();
  }

  trackPid(pid) {
    if (typeof pid === 'number' && pid > 0) {
      this.trackedPids.add(pid);
    }
  }

  untrackPid(pid) {
    this.trackedPids.delete(pid);
  }

  execSql(sql) {
    return execFileSync('docker', [
      'exec',
      '-i',
      this.containerName,
      'psql',
      '-U', 'postgres',
      '-d', 'postgres',
      '-X',
      '-t',
      '-A',
      '-v', 'ON_ERROR_STOP=1',
      '-c', sql
    ], {
      shell: false,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  }

  async checkLockWait(blockedPid, timeoutMs = 15000, pollIntervalMs = 100) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const sql = `
        SELECT a.wait_event_type, a.wait_event, l.locktype, l.mode, l.granted
        FROM pg_stat_activity a
        JOIN pg_locks l ON a.pid = l.pid
        WHERE a.pid = ${blockedPid} AND l.granted = false AND a.wait_event_type = 'Lock';
      `;
      try {
        const res = this.execSql(sql);
        if (res && res.length > 0) {
          const parts = res.split('\n')[0].split('|');
          return {
            waiting: true,
            wait_event_type: parts[0] || 'Lock',
            wait_event: parts[1] || null,
            locktype: parts[2] || null,
            mode: parts[3] || null,
            granted: parts[4] === 't'
          };
        }
      } catch {
        // continue polling
      }
      await new Promise(r => setTimeout(r, pollIntervalMs));
    }
    return { waiting: false, wait_event_type: null };
  }

  emergencyTerminate() {
    if (this.trackedPids.size === 0) return;
    const pids = Array.from(this.trackedPids).join(',');
    try {
      this.execSql(`SELECT pg_terminate_backend(pid) FROM unnest(ARRAY[${pids}]) AS pid;`);
    } catch {
      // ignore backend termination errors on exit
    }
    this.trackedPids.clear();
  }
}

async function main() {
  const args = process.argv.slice(2);
  let scenarioArg = 'all';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--scenario' && args[i + 1]) {
      scenarioArg = args[i + 1].toLowerCase();
      i++;
    } else if (args[i].startsWith('--scenario=')) {
      scenarioArg = args[i].split('=')[1].toLowerCase();
    }
  }

  const container = discoverDatabaseContainer();
  const supervisor = new Supervisor(container.name);

  // Register process termination hooks
  const emergencyCleanup = () => {
    supervisor.emergencyTerminate();
  };
  process.on('SIGINT', emergencyCleanup);
  process.on('SIGTERM', emergencyCleanup);

  const scenarioMap = {
    conc01: { id: 'CONC-01', runner: runConc01 },
    conc02: { id: 'CONC-02', runner: runConc02 },
    conc03: { id: 'CONC-03', runner: runConc03 }
  };

  const selectedKeys = scenarioArg === 'all'
    ? ['conc01', 'conc02', 'conc03']
    : (scenarioMap[scenarioArg] ? [scenarioArg] : null);

  if (!selectedKeys) {
    console.error(JSON.stringify({
      result: 'FAIL',
      error: `Unknown scenario: ${scenarioArg}. Choose from: conc01, conc02, conc03, all`
    }, null, 2));
    process.exit(1);
  }

  const summary = {
    result: 'FAIL',
    target: 'local_supabase',
    container_verified: true,
    scenarios: []
  };

  try {
    for (const key of selectedKeys) {
      const scenario = scenarioMap[key];
      const scenarioResult = await scenario.runner(container.name, supervisor);
      summary.scenarios.push(scenarioResult);
    }

    const allPassed = summary.scenarios.length > 0 && summary.scenarios.every(s => s.status === 'PASS');
    summary.result = allPassed ? 'PASS' : 'FAIL';

    process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
    process.exit(allPassed ? 0 : 1);
  } catch (err) {
    summary.result = 'FAIL';
    summary.error = err.message || String(err);
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
    process.exit(1);
  } finally {
    supervisor.emergencyTerminate();
  }
}

// Only execute when run directly as main script
if (process.argv[1] && process.argv[1].endsWith('runner.mjs')) {
  main().catch((err) => {
    console.error(JSON.stringify({ result: 'FAIL', error: err.message || String(err) }));
    process.exit(1);
  });
}
