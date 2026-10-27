import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const MAX_SOURCE = 12000
const MAX_OUTPUT = 8000
const MAX_STDIN = 2000
const TIMEOUT_MS = 8000

function firstExisting(candidates, fallback) {
  return candidates.find((candidate) => candidate && existsSync(candidate)) || fallback
}

function binary(name, extra) {
  const home = os.homedir()
  return firstExisting(
    [process.env[`PBMP_${name.toUpperCase()}`], ...extra, path.join(home, '.local', 'bin', name)],
    name,
  )
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
        PATH: process.env.PATH || '/usr/bin:/bin',
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
  if (/public\s+class\s+Main\b/.test(source)) return source
  if (/public\s+class\s+\w+/.test(source)) return source.replace(/public\s+class\s+\w+/, 'public class Main')
  return `public class Main {\n  public static void main(String[] args) {\n    ${source}\n  }\n}\n`
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
      const python = binary('python3', ['/usr/bin/python3'])
      await fs.writeFile(path.join(dir, 'main.py'), code)
      return await runCommand(python, ['-I', 'main.py'], dir, input)
    }
    if (lang === 'php') {
      const php = binary('php', ['/usr/bin/php'])
      const body = code.includes('<?') ? code : `<?php\n${code}\n`
      await fs.writeFile(path.join(dir, 'main.php'), body)
      return await runCommand(php, ['-n', '-d', 'disable_functions=exec,shell_exec,system,passthru,proc_open,popen', 'main.php'], dir, input)
    }
    const javac = binary('javac', [path.join(os.homedir(), '.local', 'jdk', 'bin', 'javac'), '/usr/bin/javac'])
    const java = binary('java', [path.join(os.homedir(), '.local', 'jdk', 'bin', 'java'), '/usr/bin/java'])
    await fs.writeFile(path.join(dir, 'Main.java'), javaSource(code))
    const compiled = await runCommand(javac, ['Main.java'], dir)
    if (compiled.code !== 0) return compiled
    return await runCommand(java, ['-cp', dir, 'Main'], dir, input)
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
}
