/**
 * Publish `dist/` to the `gh-pages` branch of a remote.
 *
 * Uses a detached worktree rather than `git subtree` so the branch stays a
 * single-commit orphan — the built output never accumulates history and never
 * touches the working tree.
 *
 *   node scripts/deploy-pages.mjs --remote showcase --base /sylva-landing/
 */
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i > -1 ? argv[i + 1] : fallback
}

const remote = arg('remote', 'origin')
const base = arg('base', '/')
const branch = arg('branch', 'gh-pages')

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
