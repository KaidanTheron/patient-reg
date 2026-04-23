import type { CodegenConfig } from '@graphql-codegen/cli'
 
const config: CodegenConfig = {
  schema: '../backend/src/schema.gql',
  documents: ['app/**/*.{ts,tsx}'],
  ignoreNoDocuments: true,
  generates: {
    './app/graphql/': {
      preset: 'client',
      config: {
        documentMode: "string",
        // @graphql-typed-document-node/core is types-only (empty "main"); type-only imports avoid Vite resolution errors.
        useTypeImports: true,
      },
    },
    './schema.graphql': {
      plugins: ['schema-ast'],
      config: {
        includeDirectives: true
      }
    }
  }
}
 
export default config