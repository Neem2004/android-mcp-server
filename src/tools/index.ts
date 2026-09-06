import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { execAdb, execAdbShell } from "../adb/client.js";

const execFileAsync = promisify(execFile);

export interface GetLogcatArgs {
  lines?: number;
  filter_tag?: string;
  log_level?: string;
}

export interface ListPackagesArgs {
  filter?: string;
  include_system?: boolean;
}

export interface ExecuteShellArgs {
  command: string;
}

export type ToolCallArgs =
  | GetLogcatArgs
  | ListPackagesArgs
  | ExecuteShellArgs
  | Record<string, never>;

export interface AdbDumpResult {
  stdout: string;
}

export const tools: Tool[] = [
  {
    name: "adb_get_logcat",
    description:
      "Dumps the Android device logcat buffer, optionally filtered by tag, minimum log level and limited to the last N lines. / Vuelca el buffer de logcat del dispositivo Android, opcionalmente filtrado por tag, nivel mínimo de log y limitado a las últimas N líneas.",
    inputSchema: {
      type: "object",
      properties: {
        lines: {
          type: "number",
          description:
            "Number of last lines to return (defaults to the full buffer). / Número de últimas líneas a retornar (por defecto, el buffer completo).",
          default: 200,
          minimum: 1,
          examples: [200, 1000],
        },
        filter_tag: {
          type: "string",
          description:
            "Only include entries whose tag matches this log tag (e.g. MyApp). / Incluye solo entradas cuyo tag coincida (p. ej. MyApp).",
          examples: ["MyApp", "ActivityManager"],
        },
        log_level: {
          type: "string",
          enum: ["V", "D", "I", "W", "E", "F"],
          description:
            "Minimum log level to include (V=verbose … F=fatal). Requires filter_tag to take effect. / Nivel mínimo de log a incluir (V=verbose … F=fatal). Requiere filter_tag para tener efecto.",
          examples: ["D", "E"],
        },
      },
      required: [],
    },
  },
  {
    name: "adb_clear_logcat",
    description:
      "Clears the device logcat buffer and returns a confirmation message. Use it before capturing a clean log stream. / Limpia el buffer de logcat del dispositivo y devuelve un mensaje de confirmación. Útil antes de capturar un stream de logs limpio.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "adb_dump_hierarchy",
    description:
      "Returns the current UI hierarchy of the Android device as XML/text via uiautomator. Useful for UI automation and understanding the visible layout. / Devuelve la jerarquía de la UI actual del dispositivo Android como texto/XML vía uiautomator. Útil para automatización de UI y entender el layout visible.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "adb_list_packages",
    description:
      "Lists the packages installed on the Android device (third-party only by default), optionally filtered by a case-insensitive name substring and including system packages. / Lista los paquetes instalados del dispositivo Android (solo de terceros por defecto), con filtro opcional por subcadena del nombre sin distinguir mayúsculas y opción de incluir paquetes de sistema.",
    inputSchema: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          description:
            "Only list packages whose name contains this text (case-insensitive). / Lista solo paquetes cuyo nombre contenga este texto (sin distinguir mayúsculas).",
          examples: ["com.example", "google"],
        },
        include_system: {
          type: "boolean",
          description:
            "If true, include system packages; if false or omitted, only third-party packages are listed. / Si es true, incluye paquetes de sistema; si es false u omitido, solo lista paquetes de terceros.",
          default: false,
          examples: [true, false],
        },
      },
      required: [],
    },
  },
  {
    name: "adb_execute_shell",
    description:
      "Runs a safe shell command on the Android device, restricted to an allowlist of read-only prefixes (getprop, dumpsys, pm list). Command chaining, pipes and injection metacharacters are rejected. / Ejecuta un comando shell seguro en el dispositivo Android, restringido a una lista blanca de prefijos de solo lectura (getprop, dumpsys, pm list). Se rechazan encadenamientos, tuberías y metacaracteres de inyección.",
    inputSchema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description:
            "Shell command to execute. Must start with one of the allowlisted prefixes: getprop, dumpsys or pm list. / Comando shell a ejecutar. Debe comenzar con uno de los prefijos permitidos: getprop, dumpsys o pm list.",
          pattern: "^(getprop|dumpsys|pm list)(\\s|$)",
          examples: [
            "getprop ro.build.version.release",
            "dumpsys battery",
            "pm list packages -3",
          ],
        },
      },
      required: ["command"],
    },
  },
];

async function runLogcat(args: GetLogcatArgs): Promise<string> {
  const adbArgs = ["logcat", "-d"];
  if (args.lines && args.lines > 0) {
    adbArgs.push("-t", String(args.lines));
  }
  if (args.log_level && args.filter_tag) {
    adbArgs.push(`${args.filter_tag}:${args.log_level}`);
  } else if (args.filter_tag) {
    adbArgs.push(`${args.filter_tag}:*`);
  }
  const output = await execAdb(adbArgs);
  return output.split("\n").filter((line) => line.trim() !== "").join("\n");
}

async function runClearLogcat(): Promise<string> {
  await execAdb(["logcat", "-c"]);
  return "Logcat buffer cleared.";
}

async function runDumpHierarchy(): Promise<string> {
  try {
    const result = await execFileAsync("adb", [
      "shell",
      "uiautomator",
      "dump",
      "/dev/tty",
    ]);
    return result.stdout;
  } catch {
    const xmlPath = "/sdcard/window_dump.xml";
    await execAdb(["shell", "uiautomator", "dump", xmlPath]);
    return execAdb(["shell", "cat", xmlPath]);
  }
}

async function runListPackages(args: ListPackagesArgs): Promise<string> {
  const adbArgs = ["shell", "pm", "list", "packages"];
  if (!args.include_system) {
    adbArgs.push("-3");
  }
  const output = await execAdb(adbArgs);
  let lines = output.split("\n").filter((line) => line.trim() !== "");
  if (args.filter) {
    lines = lines.filter((line) =>
      line.toLowerCase().includes(args.filter!.toLowerCase())
    );
  }
  return lines.join("\n");
}

function asGetLogcatArgs(args: ToolCallArgs): GetLogcatArgs {
  const unknown = args as unknown;
  if (typeof unknown !== "object" || unknown === null) {
    return {};
  }
  return args as GetLogcatArgs;
}

export async function handleToolCall(
  name: string,
  args: ToolCallArgs
): Promise<string> {
  switch (name) {
    case "adb_get_logcat":
      return runLogcat(asGetLogcatArgs(args));
    case "adb_clear_logcat":
      return runClearLogcat();
    case "adb_dump_hierarchy":
      return runDumpHierarchy();
    case "adb_list_packages":
      return runListPackages(args as ListPackagesArgs);
    case "adb_execute_shell":
      return execAdbShell((args as ExecuteShellArgs).command);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
