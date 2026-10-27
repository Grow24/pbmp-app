import { execFile, spawn } from 'node:child_process'
import { createWriteStream, existsSync, readdirSync } from 'node:fs'
import fs from 'node:fs/promises'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { promisify } from 'node:util'
import os from 'node:os'
import path from 'node:path'

const exec = promisify(execFile)
const runtimeDir = path.join(os.tmpdir(), 'pbmp-runtimes')
const pending = new Map()
const PYTHON_URL = 'https://github.com/astral-sh/python-build-standalone/releases/download/20261026/cpython-3.12.16%2B20261026-x86_64-unknown-linux-gnu-install_only_stripped.tar.gz'
const PHP_URL = 'https://dl.static-php.dev/static-php-cli/common/php-8.4.14-cli-linux-x86_64.tar.gz'
const JDK_URL = 'https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jdk/hotspot/normal/eclipse?project=jdk'

const MAX_SOURCE = 12000
const MAX_OUTPUT = 8000
const MAX_STDIN = 2000
const TIMEOUT_MS = 8000

function firstExisting(candidates, fallback) {
  return candidates.find((candidate) => candidate && existsSync(candidate)) || fallback
}

function jvmBinDirs() {
  const root = '/usr/lib/jvm'
  if (!existsSync(root)) return []
  return readdirSync(root).map((dir) => path.join(root, dir, 'bin'))
}

function binary(name, extra) {
  const home = os.homedir()
  return firstExisting(
    [process.env[`PBMP_${name.toUpperCase()}`], ...extra, path.join(home, '.local', 'bin', name)],
    name,
  )
}

function javaTool(name) {
  return binary(name, [
    path.join(os.homedir(), '.local', 'jdk', 'bin', name),
    ...jvmBinDirs().map((dir) => path.join(dir, name)),
    `/usr/lib/jvm/java-21-openjdk/bin/${name}`,
    `/usr/local/bin/${name}`,
    `/usr/bin/${name}`,
    path.join(runtimeDir, 'jdk', 'bin', name),
  ])
}

function installed(candidates) {
  return candidates.find((candidate) => candidate && existsSync(candidate)) || ''
}

function once(key, task) {
  if (!pending.has(key)) {
    pending.set(
      key,
      task().catch((error) => {
        pending.delete(key)
        throw error
      }),
    )
  }
  return pending.get(key)
}

async function download(url, dest) {
  const response = await fetch(url)
  if (!response.ok || !response.body) throw new Error(`Could not download the runtime (${response.status})`)
  await fs.mkdir(path.dirname(dest), { recursive: true })
  await pipeline(Readable.fromWeb(response.body), createWriteStream(dest))
}

async function ensurePython() {
  const found = installed([
    process.env.PBMP_PYTHON3,
    '/usr/bin/python3',
    '/usr/local/bin/python3',
    '/usr/bin/python',
    path.join(os.homedir(), '.local', 'bin', 'python3'),
  ])
  if (found) return found
  if (process.arch !== 'x64') throw new Error('python3 is not installed on this server.')
  return once('python', async () => {
    const bin = path.join(runtimeDir, 'python', 'bin', 'python3')
    if (!existsSync(bin)) {
      await fs.mkdir(runtimeDir, { recursive: true })
      const tar = path.join(runtimeDir, 'python.tar.gz')
      await download(PYTHON_URL, tar)
      await exec('tar', ['-xzf', tar, '-C', runtimeDir])
      await fs.chmod(bin, 0o755)
    }
    return bin
  })
}

async function ensurePhp() {
  const found = installed([
    process.env.PBMP_PHP,
    '/usr/bin/php',
    '/usr/local/bin/php',
    '/usr/bin/php84',
    '/usr/bin/php83',
    '/usr/bin/php82',
    path.join(os.homedir(), '.local', 'bin', 'php'),
  ])
  if (found) return found
  if (process.arch !== 'x64') throw new Error('php is not installed on this server.')
  return once('php', async () => {
    const dir = path.join(runtimeDir, 'php-bin')
    const bin = path.join(dir, 'php')
    if (!existsSync(bin)) {
      await fs.mkdir(dir, { recursive: true })
      const tar = path.join(runtimeDir, 'php.tar.gz')
      await download(PHP_URL, tar)
      await exec('tar', ['-xzf', tar, '-C', dir])
      await fs.chmod(bin, 0o755)
    }
    return bin
  })
}

function findJava(root) {
  const direct = { javac: path.join(root, 'bin', 'javac'), java: path.join(root, 'bin', 'java') }
  if (existsSync(direct.javac) && existsSync(direct.java)) return direct
  if (!existsSync(root)) return null
  for (const name of readdirSync(root)) {
    const hit = { javac: path.join(root, name, 'bin', 'javac'), java: path.join(root, name, 'bin', 'java') }
    if (existsSync(hit.javac) && existsSync(hit.java)) return hit
  }
  return null
}

async function ensureJava() {
  const javac = javaTool('javac')
  const java = javaTool('java')
  if (existsSync(javac) && existsSync(java)) return { javac, java }
  if (process.arch !== 'x64') throw new Error('javac is not installed on this server.')
  return once('java', async () => {
    const root = path.join(runtimeDir, 'jdk')
    const ready = findJava(root)
    if (ready) return ready
    await fs.mkdir(root, { recursive: true })
    const tar = path.join(runtimeDir, 'jdk.tar.gz')
    await download(JDK_URL, tar)
    await exec('tar', ['-xzf', tar, '-C', root])
    const hit = findJava(root)
    if (!hit) throw new Error('javac is not installed on this server.')
    return hit
  })
}

function clip(value) {
  const text = String(value || '')
  return text.length > MAX_OUTPUT ? `${text.slice(0, MAX_OUTPUT)}\n…output truncated` : text
}

function runCommand(command, args, cwd, stdin = '') {
  return new Promise((resolve) => {
    let settled = false
    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(result)
    }
    const child = spawn(command, args, {
      cwd,
      env: {
        PATH: [...jvmBinDirs(), '/usr/local/bin', process.env.PATH || '/usr/bin:/bin'].join(':'),
        LANG: 'C.UTF-8',
        HOME: cwd,
        TMPDIR: cwd,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    child.stdin.on('error', () => {})
    child.stdin.end(stdin)
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout = clip(stdout + chunk.toString())
    })
    child.stderr.on('data', (chunk) => {
      stderr = clip(stderr + chunk.toString())
    })
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      stderr = clip(`${stderr}\nStopped: the program ran longer than 8 seconds.`)
    }, TIMEOUT_MS)
    child.on('error', (error) => {
      finish({
        code: 127,
        stdout: stdout.trim(),
        stderr: error.code === 'ENOENT' ? `${command} is not installed on this server.` : error.message,
      })
    })
    child.on('close', (code) => {
      finish({ code: code ?? 1, stdout: stdout.trim(), stderr: stderr.trim() })
    })
  })
}

function javaSource(source) {
  const code = String(source || '').replace(/\bsystem\.(out|in|err)\b/g, 'System.$1')
  if (/public\s+class\s+Main\b/.test(code)) return code
  if (/public\s+class\s+\w+/.test(code)) return code.replace(/public\s+class\s+\w+/, 'public class Main')
  return `public class Main {\n  public static void main(String[] args) {\n    ${code}\n  }\n}\n`
}

export async function runProgram(language, source, stdin = '') {
  const lang = String(language || '').toLowerCase()
  if (!['python', 'php', 'java'].includes(lang)) throw new Error('Language must be python, php, or java')
  const code = String(source || '')
  const input = String(stdin || '')
  if (!code.trim()) throw new Error('Program is empty')
  if (code.length > MAX_SOURCE) throw new Error('Program is too long')
  if (input.length > MAX_STDIN) throw new Error('Input is too long')

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pbmp-run-'))
  try {
    if (lang === 'python') {
      const python = await ensurePython()
      await fs.writeFile(path.join(dir, 'main.py'), code)
      return await runCommand(python, ['-I', 'main.py'], dir, input)
    }
    if (lang === 'php') {
      const php = await ensurePhp()
      const body = code.includes('<?') ? code : `<?php\n${code}\n`
      await fs.writeFile(path.join(dir, 'main.php'), body)
      return await runCommand(php, ['-n', '-d', 'disable_functions=exec,shell_exec,system,passthru,proc_open,popen', 'main.php'], dir, input)
    }
    const { javac, java } = await ensureJava()
    await fs.writeFile(path.join(dir, 'Main.java'), javaSource(code))
    const compiled = await runCommand(javac, ['Main.java'], dir)
    if (compiled.code !== 0) return compiled
    return await runCommand(java, ['-cp', dir, 'Main'], dir, input)
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
}
