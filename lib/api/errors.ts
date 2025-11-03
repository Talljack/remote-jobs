import { NextResponse } from "next/server";

export interface APIError {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export interface APISuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export type APIResponse<T = unknown> = APISuccess<T> | APIError;

/**
 * Create a standardized API error response
 */
export function createAPIError(
  error: string,
  status: number = 500,
  code?: string,
  details?: unknown
): NextResponse<APIError> {
  const response: APIError = {
    success: false,
    error,
  };

  if (code) {
    response.code = code;
  }

  if (details !== undefined) {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Create a standardized API success response
 */
export function createAPISuccess<T>(
  data: T,
  status: number = 200,
  message?: string
): NextResponse<APISuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Common API errors
 */
export const APIErrors = {
  UNAUTHORIZED: () => createAPIError("Unauthorized", 401, "UNAUTHORIZED"),
  FORBIDDEN: () => createAPIError("Forbidden", 403, "FORBIDDEN"),
  NOT_FOUND: (resource: string = "Resource") =>
    createAPIError(`${resource} not found`, 404, "NOT_FOUND"),
  BAD_REQUEST: (message: string) => createAPIError(message, 400, "BAD_REQUEST"),
  INTERNAL_ERROR: () => createAPIError("Internal server error", 500, "INTERNAL_ERROR"),
  ADMIN_ONLY: () => createAPIError("Admin access required", 403, "ADMIN_ONLY"),
};
