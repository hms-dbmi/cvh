// codegen.ts - Configuration for GraphQL Code Generator
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Path to your GraphQL schema file
  schema: 'https://dev.cfdb.vis-api.link/metadata',

  // Where to output the generated types
  generates: {
    './cfdb-types.ts': {
      plugins: [
        'typescript',           // Generates base TypeScript types
        'typescript-resolvers'  // Generates resolver type signatures
      ],
      config: {
        // Use 'Maybe' type for nullable fields
        maybeValue: 'T | null | undefined',
        // Generate enum as TypeScript const for better tree-shaking
        enumsAsConst: true
      }
    }
  }
};

export default config;