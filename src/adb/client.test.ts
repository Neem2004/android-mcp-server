import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { execAdb, execAdbShell } from "./client.js";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

import { execFile } from "node:child_process";

const mockExecFile = vi.mocked(execFile);

beforeAll(() => {
  process.env.ADB_PATH = "adb";
});

afterAll(() => {
  delete process.env.ADB_PATH;
});

function mockSuccess(stdout: string, stderr = ""): void {
  mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
    (callback as (error: Error | null, stdout: string, stderr: string) => void)(
      null,
      stdout,
      stderr
    );
    return {} as ReturnType<typeof execFile>;
  });
}

function mockFailure(message: string, code: number | string): void {
  mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
    const error = new Error(message) as Error & { code?: number | string };
    error.code = code;
    (callback as (error: Error | null, stdout: string, stderr: string) => void)(
      error,
      "",
      message
    );
    return {} as ReturnType<typeof execFile>;
  });
}

describe("execAdb", () => {
  beforeEach(() => {
    mockExecFile.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("formatea correctamente los argumentos adb", async () => {
    mockSuccess("  package:com.example.app\npackage:org.foo.bar\n  ");
    const result = await execAdb(["shell", "pm", "list", "packages"]);

    expect(result).toBe("package:com.example.app\npackage:org.foo.bar");
    expect(mockExecFile).toHaveBeenCalledWith(
      "adb",
      ["shell", "pm", "list", "packages"],
      expect.objectContaining({ encoding: "utf-8", maxBuffer: 67108864 }),
      expect.any(Function)
    );
  });

  it("trimmea el stdout retornado", async () => {
    mockSuccess("  hello world  \n");
    const result = await execAdb(["-version"]);
    expect(result).toBe("hello world");
  });

  it("lanza una excepción manejable cuando el comando falla", async () => {
    mockFailure("error: no devices/emulators found", 1);

    await expect(execAdb(["logcat", "-d"])).rejects.toThrow(
      "error: no devices/emulators found"
    );
  });

  it("incluye el código de salida en el error", async () => {
    mockFailure("device unauthorized", "1");
    await expect(execAdb(["devices"])).rejects.toThrow(
      "Exit code: 1"
    );
  });
});

describe("execAdbShell", () => {
  beforeEach(() => {
    mockExecFile.mockReset();
  });

  it("ejecuta comandos shell permitidos", async () => {
    mockSuccess("ro.build.version=13");
    const result = await execAdbShell("getprop ro.build.version");
    expect(result).toBe("ro.build.version=13");
    expect(mockExecFile).toHaveBeenCalledWith(
      "adb",
      ["shell", "getprop ro.build.version"],
      expect.objectContaining({ encoding: "utf-8", maxBuffer: 67108864 }),
      expect.any(Function)
    );
  });

  it("rechaza comandos no permitidos por la lista blanca", async () => {
    await expect(execAdbShell("reboot")).rejects.toThrow(
      "Command not allowed by security policy"
    );
    expect(mockExecFile).not.toHaveBeenCalled();
  });
});
