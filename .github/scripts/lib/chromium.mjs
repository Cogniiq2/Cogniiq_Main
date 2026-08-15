// Minimal Chrome DevTools Protocol driver built on Node's built-in WebSocket
// (Node >= 22). Deliberately dependency-free: the browser test must not add a
// browser-automation package to the project, and must never download a browser
// during a Netlify build.
//
// Finds an ALREADY INSTALLED Chrome/Chromium. If none exists the caller is
// expected to skip, not to install one.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CANDIDATES = [
  process.env.CHROMIUM_PATH,
  process.env.CHROME_PATH,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/opt/google/chrome/chrome',
];

/** Locates a usable Chrome/Chromium binary, or null. */
export function findChromium() {
  for (const candidate of CANDIDATES) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  // Playwright-style browser caches (this repo's container ships one).
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (existsSync(root)) {
    for (const entry of readdirSync(root)) {
      for (const rel of [
        join(entry, 'chrome-linux', 'chrome'),
        join(entry, 'chrome-linux', 'headless_shell'),
        join(entry, 'chrome'),
      ]) {
        const full = join(root, rel);
        if (existsSync(full)) return full;
      }
    }
  }
  return null;
}

class CdpSession {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message} (${JSON.stringify(msg.error)})`));
        else resolve(msg.result);
      } else if (msg.method) {
        for (const fn of this.listeners.get(msg.method) || []) fn(msg.params);
      }
    });
  }

  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(fn);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, 60_000);
    });
  }
}

/**
 * Launches headless Chromium and opens a CDP session against a fresh tab.
 * Extensions are disabled, so anything the page logs is the page's own output.
 */
export async function launchChromium(executable) {
  const profile = mkdtempSync(join(tmpdir(), 'cogniiq-cdp-'));
  const child = spawn(
    executable,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      '--window-size=1280,900',
      'about:blank',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  const wsUrl = await new Promise((resolve, reject) => {
    let buffer = '';
    const timer = setTimeout(() => reject(new Error('Chromium did not report a DevTools endpoint')), 45_000);
    const onData = (chunk) => {
      buffer += chunk.toString();
      const match = buffer.match(/ws:\/\/[^\s]+/);
      if (match) {
        clearTimeout(timer);
        resolve(match[0]);
      }
    };
    child.stderr.on('data', onData);
    child.stdout.on('data', onData);
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Chromium exited early (code ${code}): ${buffer.slice(0, 400)}`));
    });
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', () => reject(new Error('CDP websocket failed')), { once: true });
  });

  const browser = new CdpSession(ws);
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });

  // Flat-session routing: wrap send/on so callers talk to the page target.
  const page = {
    send: (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = browser.nextId++;
        browser.pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params, sessionId }));
        setTimeout(() => {
          if (browser.pending.has(id)) {
            browser.pending.delete(id);
            reject(new Error(`CDP timeout: ${method}`));
          }
        }, 60_000);
      }),
    on: (method, fn) => browser.on(method, fn),
  };

  return {
    page,
    async close() {
      try {
        ws.close();
      } catch {
        /* already closed */
      }
      child.kill('SIGKILL');
      await new Promise((r) => setTimeout(r, 100));
      rmSync(profile, { recursive: true, force: true });
    },
  };
}
