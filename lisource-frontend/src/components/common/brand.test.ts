import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { LISOURCE_LOGO_PATH } from "./brand";

describe("LISource visual identity asset", () => {
  it("uses one public transparent PNG for the logo and favicon", () => {
    expect(LISOURCE_LOGO_PATH).toBe("/lisource-penguin.png");
    const png = readFileSync(resolve(process.cwd(), `public${LISOURCE_LOGO_PATH}`));
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(png[25]).toBe(6); // PNG truecolor with alpha channel.
  });
});
