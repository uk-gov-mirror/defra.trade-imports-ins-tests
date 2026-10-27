import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium, type Browser } from '@playwright/test';

export interface LegacyScrollersBrowser {
  browser: Browser;
  close: () => Promise<void>;
}

function headlessShellPath(): string {
  const chromiumPath = chromium.executablePath();
  const install = /^(?<root>.+)\/chromium-(?<revision>\d+)\/chrome-mac-(?<arch>[\w-]+)\//.exec(chromiumPath)?.groups;
  if (!install) {
    throw new Error(`No Playwright headless shell install found beside ${chromiumPath}`);
  }
  return path.join(
    install.root,
    `chromium_headless_shell-${install.revision}`,
    `chrome-headless-shell-mac-${install.arch}`,
    'chrome-headless-shell',
  );
}

function devToolsEndpointOf(shell: ChildProcess): Promise<string> {
  const startupTimeoutMs = 30_000;
  return new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(
      () => reject(new Error(`Headless shell gave no DevTools endpoint within ${startupTimeoutMs}ms:\n${output}`)),
      startupTimeoutMs,
    );
    shell.stderr?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
      const endpoint = /DevTools listening on (ws:\/\/\S+)/.exec(output)?.[1];
      if (endpoint) {
        clearTimeout(timer);
        resolve(endpoint);
      }
    });
    shell.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Headless shell exited with code ${code} before it gave a DevTools endpoint:\n${output}`));
    });
  });
}

/**
 * Launches Playwright's Chromium headless shell on macOS with legacy (always shown) scroll bars,
 * whatever the host's scroll bar setting and pointing devices, and connects to it over CDP.
 */
export async function launchLegacyScrollersBrowser(): Promise<LegacyScrollersBrowser> {
  const userDataDir = await mkdtemp(path.join(tmpdir(), 'legacy-scrollers-browser-'));
  const shell = spawn(
    headlessShellPath(),
    [
      '-AppleShowScrollBars',
      'Always',
      '--headless',
      '--hide-scrollbars',
      '--mute-audio',
      '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4',
      '--remote-debugging-port=0',
      `--user-data-dir=${userDataDir}`,
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
  const browser = await chromium.connectOverCDP(await devToolsEndpointOf(shell));
  return {
    browser,
    close: async () => {
      const exited = shell.exitCode === null ? once(shell, 'exit') : Promise.resolve();
      await browser.close();
      shell.kill();
      await exited;
      await rm(userDataDir, { recursive: true, force: true });
    },
  };
}
