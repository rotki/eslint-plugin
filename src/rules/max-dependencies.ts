import { createEslintRule } from '../utils';

export const RULE_NAME = 'max-dependencies';

export type MessageIds = 'maxDependencies';

export interface Options {
  max: number;
  ignoreTypeImports: boolean;
}

export default createEslintRule<[Options], MessageIds>({
  create(context, [options]) {
    let dependencyCount = 0;
    let firstImportNode: any = null;

    return {
      ImportDeclaration(node) {
        if (!firstImportNode) {
          firstImportNode = node;
        }

        // Skip type imports if ignoreTypeImports is true
        if (options.ignoreTypeImports && node.importKind === 'type') {
          return;
        }

        dependencyCount++;
      },
      'Program:exit': function () {
        if (dependencyCount > options.max) {
          context.report({
            data: {
              count: dependencyCount,
              max: options.max,
            },
            messageId: 'maxDependencies',
            node: firstImportNode,
          });
        }
      },
    };
  },
  defaultOptions: [
    {
      ignoreTypeImports: false,
      max: 20,
    },
  ],
  meta: {
    docs: {
      description: 'enforce a maximum number of dependencies per file',
      recommendation: 'recommended',
    },
    messages: {
      maxDependencies: 'Maximum number of dependencies ({{ max }}) exceeded ({{ count }}).',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          ignoreTypeImports: {
            type: 'boolean',
          },
          max: {
            minimum: 0,
            type: 'integer',
          },
        },
        type: 'object',
      },
    ],
    type: 'suggestion',
  },
  name: RULE_NAME,
});
