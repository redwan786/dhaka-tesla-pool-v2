export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  token?: string | null;
};

type ApiEnvelope<T> = {
  message: string;
  data: T;
};

type ApiErrorPayload = {
  message?: string;
  code?: string;
  details?: unknown;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, token, headers, ...requestOptions } = options;
  const response = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...requestOptions,
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as
    | ApiEnvelope<T>
    | ApiErrorPayload;

  if (!response.ok) {
    const error = payload as ApiErrorPayload;
    throw new ApiError(
      response.status,
      error.code ?? 'REQUEST_FAILED',
      error.message ?? 'The request could not be completed',
      error.details,
    );
  }

  return (payload as ApiEnvelope<T>).data;
}
