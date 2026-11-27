import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

test('the emitted Vercel entry point loads in Node without a TypeScript loader', () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const output = mkdtempSync(join(tmpdir(), 'garden-vercel-runtime-'));
  try {
    const compiled = spawnSync(process.execPath, [
      join(root, 'node_modules/typescript/lib/tsc.js'), '--project', join(root, 'tsconfig.json'),
      '--noEmit', 'false', '--outDir', output, '--rootDir', root,
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(compiled.status, 0, compiled.stdout + compiled.stderr);
    writeFileSync(join(output, 'package.json'), JSON.stringify({ type: 'module' }));
    symlinkSync(join(root, 'node_modules'), join(output, 'node_modules'), 'dir');
    const script = `
      import assert from 'node:assert/strict';
      import handler from './api/garden/[...path].js';
      delete process.env.GARDEN_DATABASE_URL;
      delete process.env.GARDEN_PUBLIC_URL;
      let status, payload;
      await handler({}, {
        writeHead(code) { status = code; },
        end(body) { payload = JSON.parse(body); },
      });
      assert.equal(status, 503);
      assert.match(payload.error, /hosted garden is being connected/);
    `;
    const executed = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: output, encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '' },
    });
    assert.equal(executed.status, 0, executed.stdout + executed.stderr);
  } finally { rmSync(output, { recursive: true, force: true }); }
});
