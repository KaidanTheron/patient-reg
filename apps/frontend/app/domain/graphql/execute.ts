import type { TypedDocumentString } from "~/graphql/graphql";

type GraphqlResult<TResult> = {
  data?: TResult;
  errors?: Array<{ message: string }>;
};

type ExecuteOptions<TResult, TVariables> = {
  document: TypedDocumentString<TResult, TVariables>;
  bearerToken?: string | null;
  cookieHeader?: string | null;
};

function graphqlEndpoint() {
  const rawUrl =
    import.meta.env.VITE_BACKEND_URL ??
    import.meta.env.BACKEND_URL ??
    "http://localhost:3000";
  const base = String(rawUrl).replace(/\/$/, "");

  return base.endsWith("/graphql") ? base : `${base}/graphql`;
}

export async function executeGraphql<TResult, TVariables = Record<string, never>>(
  options: ExecuteOptions<TResult, TVariables> &
    (TVariables extends Record<string, never>
      ? { variables?: never }
      : { variables: TVariables }),
): Promise<TResult> {
  const headers = new Headers({
    "content-type": "application/json",
  });

  if (options.bearerToken) {
    headers.set("authorization", `Bearer ${options.bearerToken}`);
  }

  if (typeof window === "undefined" && options.cookieHeader) {
    headers.set("cookie", options.cookieHeader);
  }

  const response = await fetch(graphqlEndpoint(), {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: options.document.toString(),
      variables: options.variables ?? {},
    }),
  });

  const payload = (await response.json()) as GraphqlResult<TResult>;

  if (!response.ok || payload.errors?.length) {
    throw new Error(
      payload.errors?.map((error) => error.message).join("; ") ||
        `GraphQL request failed with ${response.status}`,
    );
  }

  if (!payload.data) {
    throw new Error("GraphQL request returned no data");
  }

  return payload.data;
}
