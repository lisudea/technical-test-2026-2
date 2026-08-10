import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const dialogSource = readFileSync(new URL("./reservation-dialog.tsx", import.meta.url), "utf8");

describe("reservation conflict UI", () => {
  it("keeps the editable form open and preserves its state after a 409", () => {
    const handlerStart = dialogSource.indexOf("onError:");
    const conflictHandler = dialogSource.slice(
      handlerStart,
      dialogSource.indexOf("\n  });", handlerStart),
    );

    expect(conflictHandler).toContain("error instanceof ApiError && error.status === 409");
    expect(conflictHandler).toContain("setConflict(true)");
    expect(conflictHandler).toContain('t("reservations.conflictTitle")');
    expect(conflictHandler).toContain("return;");
    expect(conflictHandler).not.toContain("onOpenChange(false)");
    expect(dialogSource).toContain("setForm((previous) => ({ ...previous, ...patch }))");
    expect(dialogSource).toMatch(/setForm\([\s\S]*?setConflict\(false\)/);
  });
});
