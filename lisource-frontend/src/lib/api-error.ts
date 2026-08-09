/**
 * Transport-agnostic error shared by the REST API client and optional visual mocks.
 * Components never read HTTP details: they translate `messageKey`.
 */
import type { FieldProblem, ProblemDetails } from "@/types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly messageKey: string;
  readonly details?: Record<string, string> | undefined;
  readonly fieldErrors: FieldProblem[];
  readonly correlationId: string | undefined;

  constructor(status: number, details?: Record<string, string>, problem?: ProblemDetails) {
    super(problem?.detail ?? `ApiError ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = problem?.code;
    this.details = details;
    this.fieldErrors = problem?.fieldErrors ?? [];
    this.correlationId = problem?.correlationId;
    this.messageKey = codeToMessageKey(problem?.code) ?? statusToMessageKey(status);
  }
}

export function codeToMessageKey(code: string | undefined): string | undefined {
  switch (code) {
    case "INVALID_CREDENTIALS":
      return "auth.invalid";
    case "ACCOUNT_INACTIVE":
      return "auth.accountInactive";
    case "INSTITUTIONAL_EMAIL_REQUIRED":
      return "auth.institutionalRequired";
    case "REFRESH_TOKEN_INVALID":
    case "REFRESH_TOKEN_EXPIRED":
      return "errors.unauthorized";
    case "ACCESS_DENIED":
      return "errors.forbidden";
    case "RESOURCE_NOT_FOUND":
    case "EQUIPMENT_NOT_FOUND":
    case "RESERVATION_NOT_FOUND":
      return "errors.notFound";
    case "EQUIPMENT_IDENTIFIER_CONFLICT":
      return "equipment.identifierConflict";
    case "EQUIPMENT_NOT_RESERVABLE":
      return "equipment.notReservable";
    case "RESERVATION_CONFLICT":
      return "reservations.conflict";
    case "RESERVATION_ALREADY_CANCELLED":
      return "reservations.alreadyCancelled";
    case "RESERVATION_CANNOT_BE_CANCELLED":
      return "reservations.cannotCancel";
    case "VALIDATION_ERROR":
    case "INVALID_DATE_RANGE":
      return "errors.validation";
    case "GOOGLE_AUTHENTICATION_FAILED":
      return "auth.googleFailed";
    case "ROLE_SELECTION_REQUIRED":
    case "ROLE_NOT_ASSIGNED":
    case "ROLE_NOT_AVAILABLE":
      return "auth.roleUnavailable";
    case "IMAGE_TOO_LARGE":
      return "admin.imageTooLarge";
    case "INVALID_IMAGE_TYPE":
      return "admin.invalidImageType";
    case "IMAGE_UPLOAD_FAILED":
      return "admin.imageSavedDataOnly";
    case "EMAIL_DELIVERY_FAILED":
      return "auth.emailDeliveryFailed";
    case "INTERNAL_ERROR":
      return "errors.server";
    default:
      return undefined;
  }
}

export function statusToMessageKey(status: number): string {
  switch (status) {
    case 400:
      return "errors.badRequest";
    case 401:
      return "errors.unauthorized";
    case 403:
      return "errors.forbidden";
    case 404:
      return "errors.notFound";
    case 409:
      return "errors.conflict";
    case 422:
      return "errors.validation";
    case 500:
      return "errors.server";
    default:
      return "errors.unknown";
  }
}

export function errorMessageKey(error: unknown): string {
  return error instanceof ApiError ? error.messageKey : "errors.unknown";
}
