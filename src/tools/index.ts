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
      "Obtiene el buffer de logcat del dispositivo Android, opcionalmente filtrado por tag, nivel de log y limitado a las últimas N líneas.",
    inputSchema: {
      type: "object",
      properties: {
        lines: {
          type: "number",
          description: "Número de últimas líneas a retornar.",
        },
        filter_tag: {
          type: "string",
          description: "Filtra entradas por tag (etiqueta de log).",
        },
        log_level: {
          type: "string",
          enum: ["V", "D", "I", "W", "E", "F"],
          description: "Nivel mínimo de log a incluir.",
        },
      },
      required: [],
    },
  },
  {
    name: "adb_clear_logcat",
    description: "Limpia el buffer de logcat del dispositivo Android.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "adb_dump_hierarchy",
    description:
      "Obtiene la jerarquía de la UI actual del dispositivo Android como texto/XML.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "adb_list_packages",
    description:
      "Lista los paquetes instalados del dispositivo Android, con filtro por nombre y opción de incluir paquetes de sistema.",
    inputSchema: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          description: "Filtra los paquetes por texto en el nombre.",
        },
        include_system: {
          type: "boolean",
          description: "Si es true, incluye paquetes de sistema (sin -3).",
        },
      },
      required: [],
    },
  },
  {
    name: "adb_execute_shell",
    description:
      "Ejecuta un comando shell seguro en el dispositivo Android a través de una lista blanca de comandos.",
    inputSchema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "Comando shell a ejecutar (solo comandos permitidos).",
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
