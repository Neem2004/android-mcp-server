import { execFile, type ExecFileException } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { isCommandAllowed } from "./security.js";

export interface ExecResult {
  stdout: string;
}

const DEFAULT_MAX_BUFFER = 64 * 1024 * 1024;

export interface RunOptions {
  maxBuffer?: number;
}

function run(
  command: string,
  args: string[],
  options: RunOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      execFile(
        command,
        args,
        {
          encoding: "utf-8",
          maxBuffer: options.maxBuffer ?? DEFAULT_MAX_BUFFER,
        },
        (
          error: ExecFileException | null,
          stdout: string,
          stderr: string
        ) => {
          if (error) {
            reject(
              new Error(
                `Command failed: ${command} ${args.join(" ")}\n` +
                  `Exit code: ${error.code ?? "unknown"}\n` +
                  `${error.message}\n` +
                  `stderr: ${stderr.trim()}`
              )
            );
            return;
          }
          resolve(stdout.trim());
        }
      );
    } catch (execError) {
      const message =
        execError instanceof Error ? execError.message : String(execError);
      reject(new Error(`Failed to spawn "${command}": ${message}`));
    }
  });
}

const ADB_CANDIDATE_PATHS: string[] = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  "C:\\Android\\platform-tools",
  join(homedir(), "Android", "Sdk", "platform-tools"),
  join(homedir(), "Library", "Android", "sdk", "platform-tools"),
  join(homedir(), "android-sdk", "platform-tools"),
  "/usr/local/android-sdk/platform-tools",
].filter((p): p is string => Boolean(p));

function resolveAdbPath(): string | null {
  const candidates = [...ADB_CANDIDATE_PATHS].map((dir) => {
    const isWindows = process.platform === "win32";
    const binary = isWindows ? "adb.exe" : "adb";
    return join(dir, binary);
  });

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function getAdbBinary(): string {
  if (process.env.ADB_PATH) {
    return process.env.ADB_PATH;
  }
  const resolved = resolveAdbPath();
  return resolved ?? "adb";
}

export function execAdb(args: string[], options?: RunOptions): Promise<string> {
  return run(getAdbBinary(), args, options);
}

export function execAdbShell(
  command: string,
  options?: RunOptions
): Promise<string> {
  if (!isCommandAllowed(command)) {
    return Promise.reject(
      new Error(
        `Command not allowed by security policy: "${command}". ` +
          `Allowed prefixes: getprop, dumpsys, pm list.`
      )
    );
  }
  return run(getAdbBinary(), ["shell", command], options);
}
