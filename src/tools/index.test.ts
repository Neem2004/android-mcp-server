import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleToolCall } from "./index.js";

vi.mock("../adb/client.js", () => ({
  execAdb: vi.fn(),
  execAdbShell: vi.fn(),
}));

import { execAdb, execAdbShell } from "../adb/client.js";

const mockExecAdb = vi.mocked(execAdb);
const mockExecAdbShell = vi.mocked(execAdbShell);

describe("handleToolCall", () => {
  beforeEach(() => {
    mockExecAdb.mockReset();
    mockExecAdbShell.mockReset();
  });

  it("traduce adb_get_logcat a la llamada adb correcta", async () => {
    mockExecAdb.mockResolvedValue(
      "line1\nline2\nline3\nline4\nline5"
    );

    const result = await handleToolCall("adb_get_logcat", {
      lines: 3,
      filter_tag: "MyApp",
      log_level: "D",
    });

    expect(mockExecAdb).toHaveBeenCalledWith([
      "logcat",
      "-d",
      "-t",
      "3",
      "MyApp:D",
    ]);
    expect(result).toBe("line1\nline2\nline3\nline4\nline5");
  });

  it("aplica solo filter_tag cuando no hay log_level", async () => {
    mockExecAdb.mockResolvedValue("a\nb");

    await handleToolCall("adb_get_logcat", { filter_tag: "Camera" });

    expect(mockExecAdb).toHaveBeenCalledWith(["logcat", "-d", "Camera:*"]);
  });

  it("retorna todas las líneas cuando lines no está definido", async () => {
    mockExecAdb.mockResolvedValue("x\ny\nz");

    const result = await handleToolCall("adb_get_logcat", {});

    expect(mockExecAdb).toHaveBeenCalledWith(["logcat", "-d"]);
    expect(result).toBe("x\ny\nz");
  });

  it("confirma el borrado de logcat", async () => {
    mockExecAdb.mockResolvedValue("");

    const result = await handleToolCall("adb_clear_logcat", {});

    expect(mockExecAdb).toHaveBeenCalledWith(["logcat", "-c"]);
    expect(result).toContain("cleared");
  });

  it("lista paquetes con include_system por defecto (excluye sistema)", async () => {
    mockExecAdb.mockResolvedValue(
      "package:com.example.app\npackage:com.android.settings"
    );

    const result = await handleToolCall("adb_list_packages", {});

    expect(mockExecAdb).toHaveBeenCalledWith([
      "shell",
      "pm",
      "list",
      "packages",
      "-3",
    ]);
    expect(result).toContain("package:com.example.app");
  });

  it("no agrega -3 cuando include_system es true", async () => {
    mockExecAdb.mockResolvedValue("package:com.android.settings");

    await handleToolCall("adb_list_packages", { include_system: true });

    expect(mockExecAdb).toHaveBeenCalledWith([
      "shell",
      "pm",
      "list",
      "packages",
    ]);
  });

  it("filtra paquetes por texto", async () => {
    mockExecAdb.mockResolvedValue(
      "package:com.example.app\npackage:com.example.games\npackage:com.other.foo"
    );

    const result = await handleToolCall("adb_list_packages", {
      filter: "games",
    });

    expect(result).toBe("package:com.example.games");
  });

  it("delega en execAdbShell para adb_execute_shell", async () => {
    mockExecAdbShell.mockResolvedValue("ro.build.version=13");

    const result = await handleToolCall("adb_execute_shell", {
      command: "getprop ro.build.version",
    });

    expect(mockExecAdbShell).toHaveBeenCalledWith("getprop ro.build.version");
    expect(result).toBe("ro.build.version=13");
  });

  it("lanza error para herramientas desconocidas", async () => {
    await expect(handleToolCall("adb_nonexistent", {})).rejects.toThrow(
      "Unknown tool"
    );
  });
});
