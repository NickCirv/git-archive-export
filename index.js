#!/usr/bin/env node
/**
 * git-archive-export — Export files from git history at any commit, branch, or tag.
 * Zero external dependencies. Node 18+. MIT License.
 */

import { execFileSync, spawnSync } from 'child_process';
import { createWriteStream, mkdirSync, existsSync, writeFileSync } from 'fs';
import { resolve, dirname, basename, join } from 'path';
import { createDeflateRaw } from 'zlib';

// ── ANSI helpers ──────────────────────────────────────────────────────────────

const isTTY = process.stderr.isTTY;
const c = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  dim:   '\x1b[2m',
  green: '\x1b[32m',
  yellow:'\x1b[33m',
  cyan:  '\x1b[36m',
  red:   '\x1b[31m',
};
const col = (code, str) => isTTY ? `${code}${str}${c.reset}` : str;
const err  = (msg) => { process.stderr.write(col(c.red,  `✖ ${msg}`) + '\n'); };
const info = (msg) => { process.stderr.write(col(c.cyan, `  ${msg}`) + '\n'); };
const ok   = (msg) => { process.stderr.write(col(c.green,`✔ ${msg}`) + '\n'); };
const warn = (msg) => { process.stderr.write(col(c.yellow,`⚠ ${msg}`) + '\n'); };

const progress = (label) => {
  if (!isTTY) return { tick: () => {}, done: () => {} };
  let n = 0;
  const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  const iv = setInterval(() => {
    process.stderr.write(`\r${frames[n++ % frames.length]} ${label}...`);
  }, 80);
  return {
    tick: () => {},
    done: (msg = 'done') => {
      clearInterval(iv);
      process.stderr.write(`\r${col(c.green, '✔')} ${label} — ${msg}\n`);
    },
  };
};

// ── Git helpers ───────────────────────────────────────────────────────────────

/**
 * Run git and return stdout Buffer. Throws on non-zero exit.
 * Uses execFileSync (NOT exec) — no shell injection risk.
 */
function git(args, opts = {}) {
  try {
    return execFileSync('git', args, { maxBuffer: 512 * 1024 * 1024, ...opts });
  } catch (e) {
    const msg = (e.stderr || e.stdout || e.message || '').toString().trim();
    throw new Error(msg || `git ${args[0]} failed`);
  }
}

function gitStr(args, opts = {}) {
  return git(args, opts).toString('utf8').trimEnd();
}

/** Parse "path@ref" — splits on the LAST @ so refs with / work fine. */
function parseTarget(target) {
  const idx = target.lastIndexOf('@');
  if (idx === -1) return { path: target, ref: 'HEAD' };
  return { path: target.slice(0, idx), ref: target.slice(idx + 1) || 'HEAD' };
}

function assertGitRepo() {
  try {
    gitStr(['rev-parse', '--git-dir']);
  } catch {
    err('Not inside a git repository.');
    process.exit(1);
  }
}

function resolveRef(ref) {
  try {
    return gitStr(['rev-parse', '--verify', ref]);
  } catch {
    err(`Ref not found: ${ref}`);
    process.exit(1);
  }
}

// ── Zip builder (manual, uses zlib) ──────────────────────────────────────────

function crc32(buf) {
  const table = crc32.table || buildCrc32Table();
  crc32.table = table;
  let c2 = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c2 = (c2 >>> 8) ^ table[(c2 ^ buf[i]) & 0xff];
  return (c2 ^ 0xffffffff) >>> 0;
}

function buildCrc32Table() {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c2 = n;
    for (let k = 0; k < 8; k++) c2 = (c2 & 1) ? 0xedb88320 ^ (c2 >>> 1) : c2 >>> 1;
    t[n] = c2;
  }
  return t;
}

function u16le(n) { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; }
function u32le(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; }

function dosDateTime() {
  const d = new Date();
  const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  return { date: dosDate, time: dosTime };
}

async function compressBuffer(data) {
  return new Promise((res, rej) => {
    const chunks = [];
    const deflate = createDeflateRaw({ level: 6 });
    deflate.on('data', (c2) => chunks.push(c2));
    deflate.on('end', () => res(Buffer.concat(chunks)));
    deflate.on('error', rej);
    deflate.end(data);
  });
}

async function buildZip(entries) {
  // entries: [{name, data}] where data is Buffer
  const localHeaders = [];
  const centralDirs = [];
  let offset = 0;

  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const compressed = await compressBuffer(data);
    const crc = crc32(data);
    const { date, time } = dosDateTime();

    const local = Buffer.concat([
      Buffer.from([0x50,0x4b,0x03,0x04]), // local file header sig
      u16le(20),           // version needed
      u16le(0),            // flags
      u16le(8),            // compression: deflate
      u16le(time),
      u16le(date),
      u32le(crc),
      u32le(compressed.length),
      u32le(data.length),
      u16le(nameBuf.length),
      u16le(0),            // extra field length
      nameBuf,
      compressed,
    ]);

    centralDirs.push({
      offset,
      crc,
      compressedSize: compressed.length,
      uncompressedSize: data.length,
      nameBuf,
      date,
      time,
    });

    localHeaders.push(local);
    offset += local.length;
  }

  const centralDirBufs = centralDirs.map(({ offset: lhOffset, crc, compressedSize, uncompressedSize, nameBuf, date, time }) =>
    Buffer.concat([
      Buffer.from([0x50,0x4b,0x01,0x02]), // central dir sig
      u16le(20),  // version made by
      u16le(20),  // version needed
      u16le(0),   // flags
      u16le(8),   // compression
      u16le(time),
      u16le(date),
      u32le(crc),
      u32le(compressedSize),
      u32le(uncompressedSize),
      u16le(nameBuf.length),
      u16le(0),   // extra
      u16le(0),   // comment
      u16le(0),   // disk start
      u16le(0),   // internal attr
      u32le(0),   // external attr
      u32le(lhOffset),
      nameBuf,
    ])
  );

  const centralDirBuf = Buffer.concat(centralDirBufs);
  const eocd = Buffer.concat([
    Buffer.from([0x50,0x4b,0x05,0x06]), // EOCD sig
    u16le(0), u16le(0),
    u16le(centralDirs.length),
    u16le(centralDirs.length),
    u32le(centralDirBuf.length),
    u32le(offset),
    u16le(0),
  ]);

  return Buffer.concat([...localHeaders, centralDirBuf, eocd]);
}

// ── Commands ──────────────────────────────────────────────────────────────────

async function cmdExport({ target, output, format }) {
  assertGitRepo();
  const { path, ref } = parseTarget(target);
  const isDir = path.endsWith('/') || path === '';

  resolveRef(ref); // validate ref early

  if (isDir) {
    // Directory export
    if (!format) format = 'tar';
    const p = progress(`Exporting ${col(c.bold, path || '.')} at ${col(c.bold, ref)} as ${format}`);

    if (format === 'tar') {
      const archiveArgs = ['archive', '--format=tar', ref];
      if (path) archiveArgs.push('--', path);

      if (output) {
        const out = resolve(output);
        mkdirSync(dirname(out), { recursive: true });
        const buf = git(archiveArgs);
        writeFileSync(out, buf);
        p.done(`saved to ${out}`);
      } else {
        p.done('streaming to stdout');
        const result = spawnSync('git', archiveArgs, { stdio: ['inherit', 'inherit', 'pipe'], maxBuffer: 512 * 1024 * 1024 });
        if (result.status !== 0) {
          err((result.stderr || '').toString().trim());
          process.exit(1);
        }
      }

    } else if (format === 'zip') {
      // List files in the tree
      const lsArgs = ['ls-tree', '-r', '--name-only', ref];
      if (path) lsArgs.push(path);
      const files = gitStr(lsArgs).split('\n').filter(Boolean);

      if (files.length === 0) {
        err(`No files found at ${path || '.'} in ref ${ref}`);
        process.exit(1);
      }

      const entries = [];
      for (const f of files) {
        const data = git(['show', `${ref}:${f}`]);
        const entryName = path ? f.slice(path.length).replace(/^\//, '') : f;
        entries.push({ name: entryName, data });
      }

      const zipBuf = await buildZip(entries);
      p.done(`${files.length} files, ${(zipBuf.length / 1024).toFixed(1)}KB`);

      if (output) {
        const out = resolve(output);
        mkdirSync(dirname(out), { recursive: true });
        writeFileSync(out, zipBuf);
        ok(`Saved to ${out}`);
      } else {
        process.stdout.write(zipBuf);
      }

    } else {
      err(`Unknown format: ${format}. Use tar or zip.`);
      process.exit(1);
    }

  } else {
    // Single file export
    const showRef = `${ref}:${path}`;
    let data;
    try {
      data = git(['show', showRef]);
    } catch (e) {
      err(`Cannot read ${showRef}: ${e.message}`);
      process.exit(1);
    }

    if (output) {
      const out = resolve(output);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, data);
      ok(`Exported ${col(c.bold, path)} @ ${ref} → ${out} (${data.length} bytes)`);
    } else {
      process.stdout.write(data);
    }
  }
}

function cmdDiff({ ref1, ref2, path }) {
  assertGitRepo();
  resolveRef(ref1);
  resolveRef(ref2);
  const args = ['diff', '--stat', ref1, ref2];
  if (path) args.push('--', path);
  info(`Diff ${col(c.bold, ref1)} → ${col(c.bold, ref2)}${path ? ` in ${path}` : ''}`);
  const result = spawnSync('git', args, { stdio: 'inherit' });
  process.exit(result.status || 0);
}

function cmdLog({ path }) {
  assertGitRepo();
  const args = ['log', '--follow', '--pretty=format:%C(yellow)%h%Creset %C(bold)%ad%Creset %an — %s', '--date=short'];
  if (path) args.push('--', path);
  info(`Log for ${col(c.bold, path || '(all)')}`);
  const result = spawnSync('git', args, { stdio: 'inherit' });
  process.exit(result.status || 0);
}

function cmdBlame({ target }) {
  assertGitRepo();
  const { path, ref } = parseTarget(target);
  if (!path) { err('Provide a file path for --blame'); process.exit(1); }
  const sha = resolveRef(ref);
  const args = ['blame', sha, '--', path];
  info(`Blame for ${col(c.bold, path)} @ ${ref}`);
  const result = spawnSync('git', args, { stdio: 'inherit' });
  process.exit(result.status || 0);
}

function cmdRefs() {
  assertGitRepo();
  const branches = gitStr(['branch', '-a', '--format=%(refname:short)']).split('\n').filter(Boolean);
  const tags     = gitStr(['tag', '-l']).split('\n').filter(Boolean);
  process.stdout.write(col(c.bold + c.cyan, 'Branches:\n'));
  branches.forEach(b => process.stdout.write(`  ${col(c.green, b)}\n`));
  process.stdout.write(col(c.bold + c.cyan, 'Tags:\n'));
  if (tags.length === 0) process.stdout.write(`  ${col(c.dim, '(none)')}\n`);
  tags.forEach(t => process.stdout.write(`  ${col(c.yellow, t)}\n`));
}

function cmdExists({ target }) {
  assertGitRepo();
  const { path, ref } = parseTarget(target);
  try {
    resolveRef(ref);
    git(['cat-file', '-e', `${ref}:${path}`]);
    ok(`${path} exists at ${ref}`);
    process.exit(0);
  } catch {
    err(`${path} does not exist at ${ref}`);
    process.exit(1);
  }
}

// ── Help ──────────────────────────────────────────────────────────────────────

function printHelp() {
  process.stdout.write(`
${col(c.bold, 'git-archive-export')} ${col(c.dim, '(gax)')}
Export files from git history. Any commit, branch, or tag. Zero dependencies.

${col(c.bold + c.cyan, 'USAGE')}
  gax <path>[@<ref>] [options]         Export file or directory at ref
  gax --diff <ref1> <ref2> [path]      Show what changed between two refs
  gax --log [path]                     Show git log for a file
  gax --blame <path>[@<ref>]           Show git blame at ref
  gax --refs                           List all branches and tags
  gax --exists <path>[@<ref>]          Check if file exists at ref (exit 0/1)

${col(c.bold + c.cyan, 'OPTIONS')}
  --output, -o <path>   Write to file/directory instead of stdout
  --format <fmt>        Output format: tar (default) | zip  (directory exports)
  --help, -h            Show this help

${col(c.bold + c.cyan, 'EXAMPLES')}
  gax src/app.js@main                          Print file at main to stdout
  gax src/app.js@abc1234 -o app-v1.js          Save file at commit to disk
  gax src/@v1.0.0 -o ./v1-src/                Export src/ dir as tar at tag
  gax src/ --format zip -o archive.zip         Export as zip
  gax --diff v1.0.0 v2.0.0 src/               Diff directory between tags
  gax --log src/app.js                         History of a file
  gax --blame src/app.js@main                  Blame at branch HEAD
  gax --refs                                   List branches and tags
  gax --exists src/app.js@main                 Check existence

${col(c.dim, 'Ref parsing: splits on the last @ — handles refs with / like origin/main, feature/auth')}
`);
}

// ── Argument parser ───────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = {};
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--help' || a === '-h') { flags.help = true; }
    else if (a === '--refs')          { flags.refs = true; }
    else if (a === '--diff')          { flags.diff = true; }
    else if (a === '--log')           { flags.log  = true; }
    else if (a === '--blame')         { flags.blame = true; }
    else if (a === '--exists')        { flags.exists = true; }
    else if (a === '--output' || a === '-o') { flags.output = args[++i]; }
    else if (a === '--format')        { flags.format = args[++i]; }
    else if (!a.startsWith('-'))      { positional.push(a); }
    else { warn(`Unknown flag: ${a}`); }
  }

  return { flags, positional };
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
  const { flags, positional } = parseArgs(process.argv);

  if (flags.help || process.argv.length === 2) {
    printHelp();
    process.exit(0);
  }

  if (flags.refs) {
    cmdRefs();
    return;
  }

  if (flags.diff) {
    const [ref1, ref2, path] = positional;
    if (!ref1 || !ref2) { err('--diff requires two refs: gax --diff <ref1> <ref2> [path]'); process.exit(1); }
    cmdDiff({ ref1, ref2, path });
    return;
  }

  if (flags.log) {
    const [path] = positional;
    cmdLog({ path });
    return;
  }

  if (flags.blame) {
    const [target] = positional;
    if (!target) { err('--blame requires a target: gax --blame <path>[@<ref>]'); process.exit(1); }
    cmdBlame({ target });
    return;
  }

  if (flags.exists) {
    const [target] = positional;
    if (!target) { err('--exists requires a target: gax --exists <path>[@<ref>]'); process.exit(1); }
    cmdExists({ target });
    return;
  }

  // Default: export
  const [target] = positional;
  if (!target) { printHelp(); process.exit(0); }

  await cmdExport({ target, output: flags.output, format: flags.format });
}

main().catch((e) => {
  err(e.message || String(e));
  process.exit(1);
});
