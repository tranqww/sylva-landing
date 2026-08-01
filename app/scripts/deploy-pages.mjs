/**
 * Publish `dist/` to the `gh-pages` branch of a remote.
 *
 * Uses a detached worktree rather than `git subtree` so the branch stays a
 * single-commit orphan — the built output never accumulates history and never
 * touches the working tree.
 *
 *   node scripts/deploy-pages.mjs --remote showcase --base /sylva-landing/
 *
 * `--remote` is deliberately required: `origin` is the private workspace
 * repository, and defaulting to it publishes nowhere visible.
 */
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  // Accepts both `--name value` and `--name=value`; the equals form used to be
  // silently ignored, which produced a build with root-absolute asset paths
  // that 404 under a project subpath.
  const eq = argv.find((a) => a.startsWith(`--${name}=`))
  if (eq) return eq.slice(name.length + 3)
  const i = argv.indexOf(`--${name}`)
  const v = i > -1 ? argv[i + 1] : undefined
  return v !== undefined && !v.startsWith('--') ? v : fallback
}

// No default. `origin` here is the *private* workspace repository, so a bare
// `npm run deploy` used to publish to the repo that does not serve Pages while
// appearing to succeed.
const remote = arg('remote')
const base = arg('base', '/')
const branch = arg('branch', 'gh-pages')

if (!remote) {
  console.error('error: --remote is required, e.g. --remote showcase')
  process.exit(1)
}

// Values reach git as argv, never a shell, so this is not about injection —
// it is about a leading dash being read as an option instead of a name.
for (const [name, value] of [
  ['remote', remote],
  ['branch', branch],
]) {
  if (value.startsWith('-') || !/^[\w./-]+$/.test(value)) {
    console.error(`error: refusing suspicious --${name}: ${value}`)
    process.exit(1)
  }
}

// The push below is a force push of an orphan history. Aiming it at a source
// branch would replace that branch's entire history with a single commit
// containing only `dist/`.
if (['main', 'master', 'workspace', 'HEAD'].includes(branch)) {
  console.error(`error: refusing to force-push build output over "${branch}"`)
  process.exit(1)
}

const root = resolve(import.meta.dirname, '..')
const repoRoot = resolve(root, '..')
const dist = join(root, 'dist')

const git = (args, cwd = repoRoot) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim()

console.log(`building with base "${base}"…`)
execFileSync('npm', ['run', 'build'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, VITE_BASE: base },
})

if (!existsSync(dist)) throw new Error('dist/ was not produced')

// Jekyll would otherwise drop any path starting with an underscore.
writeFileSync(join(dist, '.nojekyll'), '')

const work = mkdtempSync(join(tmpdir(), 'ghpages-'))
// A throwaway branch name, so a `gh-pages` branch left over from an earlier
// deploy in this clone cannot make `checkout --orphan` fail.
const staging = `deploy-${Date.now()}`

console.log(`staging ${branch} in ${work}…`)

try {
  git(['worktree', 'add', '--detach', work])
  git(['checkout', '--orphan', staging], work)
  git(['rm', '-rf', '--quiet', '.'], work)

  cpSync(dist, work, { recursive: true })

  git(['add', '-A'], work)
  git(['commit', '-m', `deploy: ${new Date().toISOString()}`], work)
  git(['push', '--force', remote, `${staging}:${branch}`], work)

  console.log(`pushed ${branch} to ${remote}`)
} finally {
  try {
    git(['worktree', 'remove', '--force', work])
  } catch {
    rmSync(work, { recursive: true, force: true })
  }
  try {
    git(['branch', '-D', staging])
  } catch {
    /* the branch only exists if checkout got that far */
  }
}
