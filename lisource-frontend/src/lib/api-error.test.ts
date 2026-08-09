import { describe, expect, it } from "vitest";
import { ApiError, codeToMessageKey, statusToMessageKey } from "./api-error";

describe("API problem mapping", () => {
  it("maps stable backend codes instead of server text", () => {
    expect(codeToMessageKey("RESERVATION_CONFLICT")).toBe("reservations.conflict");
    expect(codeToMessageKey("INVALID_CREDENTIALS")).toBe("auth.invalid");
    expect(codeToMessageKey("REFRESH_TOKEN_INVALID")).toBe("errors.unauthorized");
    expect(codeToMessageKey("RESERVATION_ALREADY_CANCELLED")).toBe("reservations.alreadyCancelled");
    expect(statusToMessageKey(403)).toBe("errors.forbidden");
  });

  it("preserves correlation and field errors", () => {
    const error = new ApiError(422, undefined, {
      status: 422,
      code: "VALIDATION_ERROR",
      correlationId: "b72fb93e-9ad3-46a8-836b-c81a56f44084",
      fieldErrors: [{ field: "endsAt", code: "INVALID_DATE_RANGE", message: "invalid" }],
    });
    expect(error.messageKey).toBe("errors.validation");
    expect(error.correlationId).toContain("b72fb93e");
    expect(error.fieldErrors[0]?.field).toBe("endsAt");
  });
});
