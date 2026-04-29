#!/usr/bin/env tsx
import { execSync } from 'child_process';
import { existsSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname ?? __dirname, '..');
let failures = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}: ${err instanceof Error ? err.message : err}`);
    failures++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

console.log('\nGovCloud MCP Pre-publish Checklist\n');

// 1. TypeScript compiles clean
check('TypeScript compiles clean (lint)', () => {
  execSync('npm run lint', { cwd: ROOT, stdio: 'pipe' });
});

// 2. Build succeeds
check('npm run build succeeds', () => {
  execSync('npm run build', { cwd: ROOT, stdio: 'pipe' });
});

// 3. Tests pass
check('npm test passes', () => {
  execSync('npm test', { cwd: ROOT, stdio: 'pipe' });
});

// 4. Version is 1.0.0+
check('package.json version is 1.0.0+', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  const [major] = pkg.version.split('.').map(Number);
  assert(major >= 1, `Version ${pkg.version} is pre-1.0. Must be 1.0.0+`);
});

// 5. README exists and is substantial
check('README.md exists and is >3000 chars', () => {
  const readmePath = join(ROOT, 'README.md');
  assert(existsSync(readmePath), 'README.md does not exist');
  const size = statSync(readmePath).size;
  assert(size > 3000, `README.md is only ${size} bytes (min 3000)`);
});

// 6. All 20 tools registered
check('20 tools registered in allTools', () => {
  // Search all compiled tool files for name: 'tool_name' patterns
  const allToolJs = execSync('find dist/tools -name "*.js" | xargs cat', { cwd: ROOT, stdio: 'pipe' }).toString();
  const toolMatches = allToolJs.match(/name:\s*["'][a-z][a-z0-9_]+["']/g) ?? [];
  const unique = new Set(toolMatches);
  assert(unique.size >= 20, `Only ${unique.size} unique tool names found in dist (expected 20)`);
});

// 7. No TODO/FIXME in src/
check('No TODO or FIXME comments in src/', () => {
  let found = '';
  try {
    found = execSync('grep -rn "TODO\\|FIXME" src/ --include="*.ts"', { cwd: ROOT, stdio: 'pipe' }).toString().trim();
  } catch {
    // grep exits 1 when no matches found — that's the success case
    return;
  }
  if (found) throw new Error(`Found TODO/FIXME:\n${found.slice(0, 200)}`);
});

// 8. No console.log in src/
check('No console.log in src/ (must use logger)', () => {
  try {
    const result = execSync('grep -rn "console\\.log" src/ --include="*.ts"', { cwd: ROOT, stdio: 'pipe' });
    throw new Error(`Found console.log:\n${result.toString().slice(0, 200)}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes('console.log')) throw err;
  }
});

// 9. dist/ exists and is non-empty
check('dist/ directory exists and is not empty', () => {
  const distPath = join(ROOT, 'dist');
  assert(existsSync(distPath), 'dist/ does not exist — run npm run build first');
  const files = execSync('find dist -name "*.js" | wc -l', { cwd: ROOT, stdio: 'pipe' }).toString().trim();
  assert(parseInt(files) > 5, `dist/ has only ${files} JS files`);
});

// 10. dist/index.js is executable
check('dist/index.js is executable', () => {
  const indexPath = join(ROOT, 'dist', 'index.js');
  assert(existsSync(indexPath), 'dist/index.js does not exist');
  const stats = statSync(indexPath);
  // mode & 0o111 checks execute bit for owner/group/other
  assert((stats.mode & 0o111) !== 0, 'dist/index.js is not executable — run: chmod +x dist/index.js');
});

// 11. .npmignore exists
check('.npmignore exists', () => {
  assert(existsSync(join(ROOT, '.npmignore')), '.npmignore does not exist');
});

// 12. LICENSE exists
check('LICENSE file exists', () => {
  assert(existsSync(join(ROOT, 'LICENSE')), 'LICENSE file does not exist');
});

// 13. Resource JSON files are valid
check('All 4 resource JSON files are valid and non-empty', () => {
  const resources = [
    'nist-800-53-rev5.json',
    'azure-compliance-map.json',
    'ironbank-registry.json',
    'fedramp-baselines.json',
  ];
  for (const file of resources) {
    const filePath = join(ROOT, 'src', 'resources', file);
    assert(existsSync(filePath), `Resource file missing: ${file}`);
    const content = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    assert(parsed && typeof parsed === 'object', `Resource file is not a JSON object: ${file}`);
    assert(Object.keys(parsed).length > 0, `Resource file is empty: ${file}`);
  }
});

// 14. No sensitive files would be published
check('No .env files or secrets in dist/', () => {
  try {
    const result = execSync('find dist -name ".env*" -o -name "*.key" -o -name "*secret*" 2>/dev/null', {
      cwd: ROOT,
      stdio: 'pipe',
    });
    const found = result.toString().trim();
    assert(!found, `Sensitive files found in dist/: ${found}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Sensitive files')) throw err;
  }
});

console.log(`\n${failures === 0 ? '✓ All checks passed — ready to publish' : `✗ ${failures} check(s) failed — fix before publishing`}\n`);

if (failures > 0) process.exit(1);
