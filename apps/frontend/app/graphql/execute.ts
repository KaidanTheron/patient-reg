import type { TypedDocumentString } from './graphql'
 
export async function execute<TResult, TVariables>(
    query: TypedDocumentString<TResult, TVariables>,
    ...[variables]: TVariables extends Record<string, never> ? [] : [variables?: TVariables]
) {
    const body = JSON.stringify({
        query: String(query),
        variables: variables ?? undefined,
    });
    
    const response = await fetch(`${process.env.BACKEND_URL}/graphql`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        Accept: 'application/graphql-response+json'
        },
        body
    })
  
    return response as Omit<Response, "json"> & { json: () => Promise<TResult> }; 
}