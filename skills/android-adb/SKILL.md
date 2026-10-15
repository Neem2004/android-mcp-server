---
name: android-adb
description: Controls and inspects a connected Android device or emulator over ADB through the Android MCP server. Use when the user wants to read logcat, capture the UI hierarchy, list installed packages, or run safe read-only adb shell commands while debugging an Android app.
when_to_use: |
  - User asks to check Android logs, logcat, or crash/error output
  - User asks for the current UI hierarchy or visible screen elements
  - User asks which packages are installed on a device or emulator
  - User wants a system property or a service dump (getprop / dumpsys / pm list)
  - Do NOT use for non-Android platforms or when no device is connected
argument-hint: Optionally, the app package name or log tag to focus on.
---

# Android ADB Control

Inspect and debug a connected Android device or emulator by driving the
**Android MCP server** (`@neem2004/android-mcp-server`).

## Requirements

This skill relies on the Android MCP server, not on the skill itself. Before
using any tool, make sure that:

1. The MCP server `@neem2004/android-mcp-server` is configured in the current
   MCP client and exposes the `adb_*` tools.
2. A device is reachable: `adb devices` lists it as `device` (not
   `unauthorized` or `offline`).
3. USB debugging is enabled on the device.

If the `adb_*` tools are not available, stop and tell the user to add the
server:

- `npx -y @neem2004/android-mcp-server`
- Repository: https://github.com/Neem2004/android-mcp-server

## Tools

| Tool | Purpose |
|------|---------|
| `adb_get_logcat` | Dump the logcat buffer. Filters: `lines`, `filter_tag`, `log_level`. |
| `adb_clear_logcat` | Clear the log buffer (use before a clean capture). |
| `adb_dump_hierarchy` | Return the current UI hierarchy (XML). |
| `adb_list_packages` | List installed packages (`filter`, `include_system`). |
| `adb_execute_shell` | Read-only shell, allowlisted to `getprop`, `dumpsys`, `pm list`. |

## Process

1. Confirm a device is connected. If none is listed, stop and tell the user to
   run `adb devices` and enable USB debugging.
2. Read the logcat buffer, UI hierarchy, or package list with the matching
   tool. Use `adb_clear_logcat` first when the user wants only fresh logs.
3. Focus on the user's target when given one: filter the logcat by tag or app,
   filter packages by name substring.
4. Summarize what you found — errors and stack traces, the app package, or the
   relevant UI nodes — and propose concrete next steps.

## Safety

- Only read-only operations are allowed. Never attempt to bypass the command
  allowlist.
- `adb_execute_shell` accepts only commands starting with `getprop`, `dumpsys`
  or `pm list`; chaining (`&&`, `||`, `;`, `|`) is rejected.
- Do not request root or run commands outside the allowlist, and never clear
  the log buffer without the user's intent.
