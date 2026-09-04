# Android ADB MCP Server

![MCP](https://img.shields.io/badge/MCP-Server-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![TypeScript](https://img.shields.io/badge/TypeScript-ES2022-blue)
![License](https://img.shields.io/badge/License-ISC-lightgrey)
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA)](https://github.com/sponsors/Neem2004)

**[English](#english) · [Español](#espanol)**

---

## English

### Description

**Android ADB MCP Server** is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that lets AI assistants — such as **Claude** and **OpenCode**, or **VS Code** through its Copilot/agent integration — control Android devices over ADB securely. It exposes tools to read `logcat`, inspect the current UI hierarchy, list installed packages, and run restricted shell commands, all gated by an allowlist that mitigates arbitrary command execution.

> **A note on terminology:** Claude and OpenCode are AI assistants. **VS Code is not an AI** — it is a code editor that *hosts* AI assistants (GitHub Copilot, and MCP-capable extensions) and is itself an MCP client. The server works with any MCP-capable client.

### Prerequisites

- **Node.js v18+** (tested up to Node.js 26).
- **ADB** installed and reachable via the system `PATH` (`adb version` must work), or located via `ADB_PATH` / `ANDROID_HOME` / standard SDK paths.
- **USB debugging enabled** on the Android device (Developer options → USB debugging).

### Installation & Usage

#### 1. Clone & install dependencies

```bash
git clone https://github.com/Neem2004/android-mcp-server.git
cd android-mcp-server
npm install
```

#### 2. Build

```bash
npm run build
```

This produces the compiled code in the `dist/` folder.

> ⚠️ **Important:** `dist/` is generated locally and is **not** committed to the repository. You **must** run `npm run build` before configuring your MCP client, or the server will fail to start.

#### 3. Configure your MCP client

Each MCP client keeps its servers in a different file, with a different format. Below are the three most common setups. In every case you must use the **absolute path** to your cloned project's `dist/index.js` (replace `YOUR_PATH_TO` with the real location of your clone).

##### OpenCode (AI assistant / CLI)

File: `opencode.json` at your project root, or `~/.config/opencode/opencode.json` (global).

```jsonc
{
  "mcp": {
    "android": {
      "type": "local",
      "command": ["node", "YOUR_PATH_TO/android-mcp-server/dist/index.js"],
      "enabled": true
    }
  }
}
```

##### Claude Desktop (AI assistant)

File: `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS).

```json
{
  "mcpServers": {
    "android": {
      "command": "node",
      "args": ["YOUR_PATH_TO/android-mcp-server/dist/index.js"]
    }
  }
}
```

##### VS Code (editor with Copilot / MCP agent support)

File: `.vscode/mcp.json` in your workspace (or via the **MCP: Open User Configuration** command). VS Code uses `servers` as the top-level key (not `mcpServers`).

```json
{
  "servers": {
    "android": {
      "type": "stdio",
      "command": "node",
      "args": ["YOUR_PATH_TO/android-mcp-server/dist/index.js"]
    }
  }
}
```

> **Development note:** instead of the compiled build you can run TypeScript directly via `tsx` by replacing the argument with `src/index.ts` and using `npx tsx` as the command. Prefer the compiled build for reliability.

#### 4. Basic validation

```bash
npm test           # runs the unit test suite
npm run build      # compiles TypeScript to dist/
npm run dev        # runs the server directly via tsx (development)
```

### Available Tools

| Tool | Description | Arguments |
|------|-------------|-----------|
| `adb_get_logcat` | Dumps the `logcat` buffer with optional filters | `lines`, `filter_tag`, `log_level` |
| `adb_clear_logcat` | Clears the device log buffer | — |
| `adb_dump_hierarchy` | Returns the current UI hierarchy (XML/text) | — |
| `adb_list_packages` | Lists installed packages | `filter`, `include_system` |
| `adb_execute_shell` | Runs a safe allowlisted shell command | `command` |

### Security

This server prioritizes safety over arbitrary command execution:

- **Shell allowlist**: `adb_execute_shell` only accepts commands whose prefix is authorized (`getprop`, `dumpsys`, `pm list`). Anything else is rejected with a descriptive error. Command chaining (`&&`, `||`, `;`, `|`) and injection metacharacters are also blocked.
- **No root**: no superuser privileges are requested; it works on standard ADB APIs.
- Commands run via `execFile` (no intermediate shell), avoiding metacharacter injection.

> The logic lives in `src/adb/security.ts`; review it before broadening permissions.

### Setting Up ADB

If you do not have ADB yet:

- **Windows**: download the official [platform-tools](https://developer.android.com/tools/releases/platform-tools) and add its folder to your system `PATH`.
- **macOS / Linux**: install via your package manager (e.g. `brew install android-platform-tools`, `apt install adb`).

Verify with:

```bash
adb devices
```

Your device should appear as `device` (not `unauthorized`/`offline`). The server will use `ADB_PATH`, then `ANDROID_HOME`/`ANDROID_SDK_ROOT`, then standard SDK locations, before falling back to `adb` on the `PATH`.

### Sponsorship

This project is 100% open source and independently maintained. If **Android ADB MCP Server** saves your team time or improves your automation workflows, please consider supporting its continued development.

- 🔗 **GitHub Sponsors**: [Sponsor Neem2004](https://github.com/sponsors/Neem2004)
- 💼 **Companies**: corporate sponsorship funds new tools, security hardening, and priority support.

Every contribution, however small, helps keep the project active, documented, and secure. Thank you for your support!

### License

ISC

---

## Español

### Descripción

**Android ADB MCP Server** es un servidor del [Model Context Protocol (MCP)](https://modelcontextprotocol.io) que permite a asistentes de IA —como **Claude** y **OpenCode**, o **VS Code** mediante su integración con Copilot/agente— controlar dispositivos Android vía ADB de forma segura. Expone herramientas para leer el `logcat`, inspeccionar la jerarquía de la UI, listar paquetes instalados y ejecutar comandos shell restringidos, todo a través de una lista blanca que mitiga los riesgos de ejecución arbitraria.

> **Nota sobre terminología:** Claude y OpenCode son asistentes de IA. **VS Code no es una IA** — es un editor de código que *aloja* asistentes de IA (GitHub Copilot y extensiones con soporte MCP) y que además es un cliente MCP. El servidor funciona con cualquier cliente compatible con MCP.

### Requisitos previos

- **Node.js v18+** (probado hasta Node.js 26).
- **ADB** instalado y accesible en el `PATH` del sistema (`adb version` debe funcionar), o localizado vía `ADB_PATH` / `ANDROID_HOME` / rutas estándar del SDK.
- **Depuración USB activada** en el dispositivo Android (Opciones de desarrollador → Depuración USB).

### Instalación y Uso

#### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/Neem2004/android-mcp-server.git
cd android-mcp-server
npm install
```

#### 2. Compilar

```bash
npm run build
```

Esto genera el código compilado en la carpeta `dist/`.

> ⚠️ **Importante:** `dist/` se genera localmente y **no** se sube al repositorio. Debes ejecutar `npm run build` **antes** de configurar tu cliente MCP, o el servidor no arrancará.

#### 3. Configurar tu cliente MCP

Cada cliente MCP guarda sus servidores en un archivo distinto, con un formato propio. A continuación están las tres configuraciones más comunes. En todos los casos debes usar la **ruta absoluta** al `dist/index.js` de tu clon (reemplaza `TU_RUTA` por la ubicación real de tu clon).

##### OpenCode (asistente de IA / CLI)

Archivo: `opencode.json` en la raíz de tu proyecto, o `~/.config/opencode/opencode.json` (global).

```jsonc
{
  "mcp": {
    "android": {
      "type": "local",
      "command": ["node", "TU_RUTA/android-mcp-server/dist/index.js"],
      "enabled": true
    }
  }
}
```

##### Claude Desktop (asistente de IA)

Archivo: `%APPDATA%\Claude\claude_desktop_config.json` (Windows) o `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS).

```json
{
  "mcpServers": {
    "android": {
      "command": "node",
      "args": ["TU_RUTA/android-mcp-server/dist/index.js"]
    }
  }
}
```

##### VS Code (editor con soporte de Copilot / agente MCP)

Archivo: `.vscode/mcp.json` en tu workspace (o mediante el comando **MCP: Open User Configuration**). VS Code usa `servers` como clave raíz (no `mcpServers`).

```json
{
  "servers": {
    "android": {
      "type": "stdio",
      "command": "node",
      "args": ["TU_RUTA/android-mcp-server/dist/index.js"]
    }
  }
}
```

> **Nota de desarrollo:** en lugar del build compilado puedes ejecutar TypeScript directamente con `tsx` reemplazando el argumento por `src/index.ts` y usando `npx tsx` como comando. Para máxima fiabilidad, prefiere el build compilado.

#### 4. Validación básica

```bash
npm test           # ejecuta la suite de tests unitarios
npm run build      # compila TypeScript a dist/
npm run dev        # ejecuta el servidor directamente con tsx (desarrollo)
```

### Tools disponibles

| Tool | Descripción | Argumentos |
|------|-------------|------------|
| `adb_get_logcat` | Vuelca el buffer de `logcat` con filtros opcionales | `lines`, `filter_tag`, `log_level` |
| `adb_clear_logcat` | Limpia el buffer de logs del dispositivo | — |
| `adb_dump_hierarchy` | Devuelve la jerarquía de la UI actual (XML/texto) | — |
| `adb_list_packages` | Lista los paquetes instalados | `filter`, `include_system` |
| `adb_execute_shell` | Ejecuta un comando shell seguro (lista blanca) | `command` |

### Seguridad

Este servidor prioriza la seguridad frente a la ejecución arbitraria de comandos:

- **Lista blanca de comandos shell**: `adb_execute_shell` solo acepta comandos cuyo prefijo esté autorizado (`getprop`, `dumpsys`, `pm list`). Cualquier otra cosa se rechaza con un error descriptivo. También se bloquean encadenamientos (`&&`, `||`, `;`, `|`) y metacaracteres de inyección.
- **Sin root**: no se solicitan privilegios de superusuario; se trabaja sobre las APIs estándar de ADB.
- Los comandos se ejecutan mediante `execFile` (sin pasar por un shell intermedio), evitando la inyección de metacaracteres.

> La lógica vive en `src/adb/security.ts`; revísalo antes de ampliar los permisos.

### Configuración de ADB

Si aún no tienes ADB:

- **Windows**: descarga los [platform-tools](https://developer.android.com/tools/releases/platform-tools) oficiales y agrega su carpeta al `PATH` del sistema.
- **macOS / Linux**: instala con tu gestor de paquetes (p. ej. `brew install android-platform-tools`, `apt install adb`).

Verifica con:

```bash
adb devices
```

Tu dispositivo debe aparecer como `device` (no `unauthorized`/`offline`). El servidor usará `ADB_PATH`, luego `ANDROID_HOME`/`ANDROID_SDK_ROOT`, luego rutas estándar del SDK, antes de caer a `adb` en el `PATH`.

### Patrocinio

Este proyecto es 100% open source y se mantiene de forma independiente. Si **Android ADB MCP Server** ahorra tiempo a tu equipo o mejora tus flujos de automatización, considera apoyar su desarrollo continuo.

- 🔗 **GitHub Sponsors**: [Patrocina a Neem2004](https://github.com/sponsors/Neem2004)
- 💼 **Empresas**: el patrocinio corporativo financia nuevas herramientas, mejoras de seguridad y soporte prioritario.

Toda contribución, por pequeña que sea, ayuda a mantener el proyecto activo, documentado y seguro. ¡Gracias por tu apoyo!

### Licencia

ISC
