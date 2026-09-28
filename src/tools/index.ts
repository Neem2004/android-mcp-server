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
      "Dumps and exits the Android logcat buffer (logcat -d; not a stream), returning newline-separated lines with blank lines removed. Optionally filters by tag, minimum log level and the last N lines. Use filter_tag alone for 'tag:*'; log_level only takes effect together with filter_tag. / Vuelca y cierra el buffer de logcat del dispositivo (logcat -d; no es un stream), devolviendo líneas separadas por saltos de línea y omitiendo las vacías. Filtra opcionalmente por tag, nivel mínimo de log y las últimas N líneas. filter_tag solo produce 'tag:*'; log_level solo tiene efecto junto con filter_tag.",
    inputSchema: {
      type: "object",
      properties: {
        lines: {
          type: "number",
          title: "lines",
          description:
            "Number of last lines to return (defaults to the full buffer). / Número de últimas líneas a retornar (por defecto, el buffer completo).",
          default: 200,
          minimum: 1,
          maximum: 1000,
          examples: [200, 1000],
        },
        filter_tag: {
          type: "string",
          title: "filter_tag",
          description:
            "Only include entries whose tag matches this log tag (e.g. MyApp). / Incluye solo entradas cuyo tag coincida (p. ej. MyApp).",
          examples: ["MyApp", "ActivityManager"],
        },
        log_level: {
          type: "string",
          title: "log_level",
          enum: ["V", "D", "I", "W", "E", "F"],
          description:
            "Minimum log level to include (V=verbose … F=fatal). Requires filter_tag to take effect; ignored otherwise. / Nivel mínimo de log a incluir (V=verbose … F=fatal). Requiere filter_tag para tener efecto; se ignora si no va.",
          examples: ["D", "E"],
        },
      },
      required: [],
    },
  },
  {
    name: "adb_clear_logcat",
    description:
      "Permanently clears the device logcat buffer (logcat -c) and returns a confirmation message. All buffered log entries are lost; subsequent dumps start fresh. Run it before capturing a clean log stream. / Limpia permanentemente el buffer de logcat del dispositivo (logcat -c) y devuelve un mensaje de confirmación. Se pierden todas las entradas en buffer; los dumps posteriores empiezan desde cero. Ejecútalo antes de capturar un stream de logs limpio.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "adb_dump_hierarchy",
    description:
      "Returns the current UI hierarchy of the Android device as XML/text via uiautomator. Tries /dev/tty first and falls back to /sdcard/window_dump.xml. May return empty when no window is focused. Useful to understand the visible layout. / Devuelve la jerarquía de la UI actual del dispositivo como texto/XML vía uiautomator. Prueba /dev/tty primero y cae a /sdcard/window_dump.xml como respaldo. Puede devolver vacío cuando no hay ventana enfocada. Útil para entender el layout visible.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "adb_list_packages",
    description:
      "Lists the packages installed on the Android device as one 'package:<name>' line each (third-party only by default). Optionally filters by a case-insensitive name substring and includes system packages. / Lista los paquetes instalados del dispositivo con una línea 'package:<name>' por cada uno (solo de terceros por defecto). Filtra opcionalmente por subcadena del nombre sin distinguir mayúsculas e incluye paquetes de sistema.",
    inputSchema: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          title: "filter",
          description:
            "Only list packages whose name contains this text (case-insensitive). / Lista solo paquetes cuyo nombre contenga este texto (sin distinguir mayúsculas).",
          examples: ["com.example", "google"],
        },
        include_system: {
          type: "boolean",
          title: "include_system",
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
      "Runs a read-only shell command on the Android device, restricted to an allowlist of safe prefixes: getprop (read system properties), dumpsys (dump services) and pm list (list packages). Anything else — including command chaining (&&, ||, ;, |) and injection metacharacters — is rejected with a descriptive error. / Ejecuta un comando shell de solo lectura en el dispositivo Android, restringido a la lista blanca de prefijos seguros: getprop (propiedades del sistema), dumpsys (volcado de servicios) y pm list (listado de paquetes). Cualquier otra cosa —incluidos encadenamientos (&&, ||, ;, |) y metacaracteres de inyección— se rechaza con un error descriptivo.",
    inputSchema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          title: "command",
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
