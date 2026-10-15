# Troubleshooting

## The `adb_*` tools are missing

The Android MCP server is not configured in the current MCP client. Add it and
restart the client:

- `npx -y @neem2004/android-mcp-server`
- Repository: https://github.com/Neem2004/android-mcp-server

## Device shows as `unauthorized` or `offline`

- `unauthorized`: accept the "Allow USB debugging?" prompt on the device.
- `offline`: unplug and replug the cable, or run `adb kill-server` and
  `adb start-server`.
- Verify with `adb devices` until the state is `device`.

## `adb` is not found

Install Android platform-tools and add them to the system `PATH`, or point the
server at them with `ADB_PATH` / `ANDROID_HOME` / `ANDROID_SDK_ROOT`.

- Windows: https://developer.android.com/tools/releases/platform-tools
- macOS / Linux: `brew install android-platform-tools` or `apt install adb`

## Logcat output is empty

- The buffer may have just been cleared. Trigger the action you want to capture
  and dump again.
- With a `filter_tag`, only entries for that tag are returned. Drop the tag to
  see the full buffer.

## A shell command was rejected

`adb_execute_shell` only allows read-only prefixes: `getprop`, `dumpsys` and
`pm list`. Command chaining and shell metacharacters are blocked by design.
Rewrite the command to use one of the allowed prefixes.
