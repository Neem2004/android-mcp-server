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

**Android ADB MCP Server** is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that lets AI assistants — Claude, OpenCode, and VS Code — control Android devices over ADB securely. It exposes tools to read `logcat`, inspect the current UI hierarchy, list installed packages, and run restricted shell commands, all gated by an allowlist that mitigates arbitrary command execution.

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

#### 3. Configure in your MCP client (OpenCode, Claude, VS Code)

Add the server to the `mcpServers` block. The recommended way uses the compiled build, which is the most reliable across platforms:

```json
{
  "mcpServers": {
    "android": {
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

> For development you can also run TypeScript directly via `tsx`:
>
> ```json
> {
>   "mcpServers": {
>     "android": {
>       "command": "npx",
>       "args": ["tsx", "src/index.ts"]
>     }
>   }
> }
> ```

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

**Android ADB MCP Server** es un servidor del [Model Context Protocol (MCP)](https://modelcontextprotocol.io) que permite a asistentes de IA —como Claude, OpenCode y VS Code— controlar dispositivos Android vía ADB de forma segura. Expone herramientas para leer el `logcat`, inspeccionar la jerarquía de la UI, listar paquetes instalados y ejecutar comandos shell restringidos, todo a través de una lista blanca que mitiga los riesgos de ejecución arbitraria.

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

#### 3. Configurar en tu cliente MCP (OpenCode, Claude, VS Code)

Agrega el servidor al bloque `mcpServers`. La forma recomendada usa el build compilado, que es la más fiable entre plataformas:

```json
{
  "mcpServers": {
    "android": {
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

> Para desarrollo también puedes ejecutar TypeScript directamente con `tsx`:
>
> ```json
> {
>   "mcpServers": {
>     "android": {
>       "command": "npx",
>       "args": ["tsx", "src/index.ts"]
>     }
>   }
> }
> ```

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
