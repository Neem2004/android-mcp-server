import { describe, expect, it } from "vitest";

import { isCommandAllowed } from "./security.js";

describe("isCommandAllowed", () => {
  it("permite comandos válidos de la lista blanca", () => {
    expect(isCommandAllowed("getprop")).toBe(true);
    expect(isCommandAllowed("getprop ro.build.version")).toBe(true);
    expect(isCommandAllowed("dumpsys")).toBe(true);
    expect(isCommandAllowed("dumpsys package")).toBe(true);
    expect(isCommandAllowed("dumpsys activity top")).toBe(true);
    expect(isCommandAllowed("pm list")).toBe(true);
    expect(isCommandAllowed("pm list packages")).toBe(true);
  });

  it("rechaza comandos peligrosos", () => {
    expect(isCommandAllowed("rm -rf /")).toBe(false);
    expect(isCommandAllowed("reboot")).toBe(false);
    expect(isCommandAllowed("su")).toBe(false);
    expect(isCommandAllowed("rm")).toBe(false);
  });

  it("rechaza comandos concatenados con && o |", () => {
    expect(isCommandAllowed("getprop && rm -rf /")).toBe(false);
    expect(isCommandAllowed("getprop | grep foo")).toBe(false);
    expect(isCommandAllowed("pm list | rm -rf /")).toBe(false);
    expect(isCommandAllowed("dumpsys && reboot")).toBe(false);
  });

  it("rechaza comandos vacíos o con solo espacios", () => {
    expect(isCommandAllowed("")).toBe(false);
    expect(isCommandAllowed("   ")).toBe(false);
  });
});
