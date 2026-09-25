import { spawn } from 'node:child_process';

/**
 * PsqlSession wraps an interactive psql session inside a Docker container
 * using child_process.spawn with shell: false.
 */
export class PsqlSession {
  constructor(containerName, name = 'session') {
    this.containerName = containerName;
    this.name = name;
    this.proc = null;
    this.pid = null;
    this.backendPid = null;
    this.buffer = '';
    this.stderrBuffer = '';
    this.listeners = [];
    this.exitPromise = null;
    this.exitCode = null;
    this.terminated = false;
  }

  /**
   * Starts interactive container psql and captures pg_backend_pid().
   */
  async start(timeoutMs = 15000) {
    this.proc = spawn('docker', [
      'exec',
      '-i',
      this.containerName,
      'psql',
      '-U', 'postgres',
      '-d', 'postgres',
      '-X',
      '-v', 'ON_ERROR_STOP=1'
    ], {
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.pid = this.proc.pid;

    this.exitPromise = new Promise((resolve) => {
      this.proc.on('exit', (code, signal) => {
        this.exitCode = code;
        resolve({ code, signal });
      });
    });

    this.proc.stdout.on('data', (chunk) => {
      this.buffer += chunk.toString();
      this._checkListeners();
    });

    this.proc.stderr.on('data', (chunk) => {
      this.stderrBuffer += chunk.toString();
    });

    // Capture backend PID immediately using a controlled marker
    this.send("SELECT pg_backend_pid() AS pid; \\echo VECLAB_SESSION_PID_READY\n");
    const out = await this.waitForMarker("VECLAB_SESSION_PID_READY", timeoutMs);
    const m = out.match(/\b(\d+)\b/);
    if (!m) {
      throw new Error(`Failed to capture pg_backend_pid for ${this.name}: ${out}`);
    }
    this.backendPid = parseInt(m[1], 10);
    return this.backendPid;
  }

  _checkListeners() {
    for (let i = this.listeners.length - 1; i >= 0; i--) {
      const { marker, resolve } = this.listeners[i];
      const idx = this.buffer.indexOf(marker);
      if (idx !== -1) {
        const payload = this.buffer.slice(0, idx);
        this.buffer = this.buffer.slice(idx + marker.length);
        this.listeners.splice(i, 1);
        resolve(payload);
      }
    }
  }

  /**
   * Sends controlled SQL text to psql stdin.
   */
  send(sql) {
    if (!this.proc || this.proc.stdin.destroyed) {
      throw new Error(`Session ${this.name} stdin not available`);
    }
    this.proc.stdin.write(sql.endsWith('\n') ? sql : sql + '\n');
  }

  /**
   * Waits until marker is emitted on stdout.
   */
  waitForMarker(marker, timeoutMs = 15000) {
    const idx = this.buffer.indexOf(marker);
    if (idx !== -1) {
      const payload = this.buffer.slice(0, idx);
      this.buffer = this.buffer.slice(idx + marker.length);
      return Promise.resolve(payload);
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const lIdx = this.listeners.findIndex(l => l.marker === marker);
        if (lIdx !== -1) this.listeners.splice(lIdx, 1);
        reject(new Error(
          `Timeout (${timeoutMs}ms) waiting for marker '${marker}' in session ${this.name}. ` +
          `Buffer: ${this.buffer}, Stderr: ${this.stderrBuffer}`
        ));
      }, timeoutMs);

      this.listeners.push({
        marker,
        resolve: (payload) => {
          clearTimeout(timer);
          resolve(payload);
        }
      });
    });
  }

  /**
   * Waits for process exit.
   */
  waitForExit(timeoutMs = 5000) {
    if (this.exitCode !== null) {
      return Promise.resolve({ code: this.exitCode });
    }
    return Promise.race([
      this.exitPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout waiting for session ${this.name} to exit`)), timeoutMs)
      )
    ]);
  }

  /**
   * Closes session cleanly with \q.
   */
  async close(timeoutMs = 5000) {
    if (this.terminated) return;
    try {
      if (this.proc && !this.proc.stdin.destroyed) {
        this.proc.stdin.write('\\q\n');
        this.proc.stdin.end();
      }
    } catch {
      // ignore stream close errors
    }

    const timer = setTimeout(() => {
      if (this.proc && !this.proc.killed) {
        try {
          this.proc.kill('SIGTERM');
        } catch {
          // ignore kill errors
        }
      }
    }, timeoutMs);

    await this.exitPromise;
    clearTimeout(timer);
    this.terminated = true;
  }

  /**
   * Terminate child process immediately.
   */
  async terminate() {
    this.terminated = true;
    if (this.proc && !this.proc.killed) {
      try {
        this.proc.kill('SIGKILL');
      } catch {
        // ignore kill errors
      }
    }
  }
}
