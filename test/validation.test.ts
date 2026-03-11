import { describe, expect, it } from "vitest";

import { ValidationError } from "../src/lib/errors.js";
import { validateSlug } from "../src/lib/validation.js";

describe("validateSlug", () => {
  it("accepts lowercase hyphenated slugs", () => {
    expect(validateSlug("free-ride")).toBe("free-ride");
  });

  it("rejects invalid characters and uppercase text", () => {
    expect(() => validateSlug("Free_Ride")).toThrow(ValidationError);
  });
});
