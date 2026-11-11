import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

test('native updater rejects untrusted hosts, corrupt hashes and changed signing identities', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'footy-update-test-'));
  try {
    const sources = ['../android-security/UpdatePolicy.java', './UpdatePolicyTest.java'].map(path => fileURLToPath(new URL(path, import.meta.url)));
    const compile = spawnSync('javac', ['-d', directory, ...sources], {encoding: 'utf8'});
    assert.equal(compile.status, 0, compile.error?.message || compile.stderr);
    const run = spawnSync('java', ['-cp', directory, 'me.mohamedlaaribi.footy.production.UpdatePolicyTest'], {encoding: 'utf8'});
    assert.equal(run.status, 0, run.error?.message || run.stderr);
  } finally { await rm(directory, {recursive: true, force: true}); }
});
