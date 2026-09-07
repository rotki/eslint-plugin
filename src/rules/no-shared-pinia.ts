import type { TSESTree } from '@typescript-eslint/utils';
import debugFactory from 'debug';
import { createEslintRule, getFilename } from '../utils';

export const RULE_NAME = 'no-shared-pinia';

export type MessageIds = 'sharedPinia';

export interface Options {
  factories: string[];
  testFilePattern: string;
}

const debug = debugFactory('@rotki/eslint-plugin:no-shared-pinia');

type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

/** The container a creation is scoped to: a `describe` callback, or the module. */
type Container = FunctionNode | TSESTree.Program;

const DESCRIBE_NAMES = new Set(['describe', 'fdescribe', 'xdescribe', 'suite']);
const BEFORE_EACH_NAMES = new Set(['beforeEach']);

const DEFAULT_FACTORIES = ['createPinia', 'createCustomPinia', 'createTestingPinia'];
const DEFAULT_TEST_FILE_PATTERN = '\\.(spec|test)\\.[cm]?[jt]sx?$';

function isFunctionNode(node: TSESTree.Node): node is FunctionNode {
  return (
    node.type === 'FunctionDeclaration'
    || node.type === 'FunctionExpression'
    || node.type === 'ArrowFunctionExpression'
  );
}

/**
 * Resolves the base identifier name a call ultimately targets, unwrapping
 * member chains (`describe.only`, `describe.skip`) and curried calls
 * (`describe.each([...])(...)`). Returns `null` when the callee is not an
 * identifier-rooted call.
 */
function getRootCalleeName(callee: TSESTree.Node): string | null {
  if (callee.type === 'Identifier')
    return callee.name;
  if (callee.type === 'MemberExpression')
    return getRootCalleeName(callee.object);
  if (callee.type === 'CallExpression')
    return getRootCalleeName(callee.callee);
  return null;
}

/**
 * When `fn` is a callback argument of a call, returns the base name of that
 * call (e.g. `describe`, `beforeEach`). Returns `null` otherwise.
 */
function callbackOwnerName(fn: FunctionNode): string | null {
  const parent = fn.parent;
  if (parent?.type !== 'CallExpression')
    return null;
  return getRootCalleeName(parent.callee);
}

/** True when `fn` is the callback argument of a `beforeEach(...)` call. */
function isBeforeEachCallback(fn: FunctionNode): boolean {
  const owner = callbackOwnerName(fn);
  return owner != null && BEFORE_EACH_NAMES.has(owner);
}

/** True when `fn` is the callback argument of a `describe(...)` call. */
function isDescribeCallback(fn: FunctionNode): boolean {
  const owner = callbackOwnerName(fn);
  return owner != null && DESCRIBE_NAMES.has(owner);
}

/**
 * Walks up from `node` to the nearest enclosing function. Returns `null` when
 * the node lives at module top level.
 */
function nearestFunction(node: TSESTree.Node): FunctionNode | null {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (isFunctionNode(current))
      return current;
    current = current.parent;
  }
  return null;
}

function buildTestFileMatcher(pattern: string): (filename: string) => boolean {
  const regex = new RegExp(pattern, 'u');
  return filename => regex.test(filename);
}

interface Candidate {
  node: TSESTree.CallExpression;
  container: Container;
  factory: string;
  atModuleScope: boolean;
}

export default createEslintRule<[Options], MessageIds>({
  create(context, optionsWithDefault) {
    const options: Partial<Options> = optionsWithDefault[0] ?? {};
    const factories = new Set(options.factories ?? DEFAULT_FACTORIES);
    const isTestFile = buildTestFileMatcher(options.testFilePattern ?? DEFAULT_TEST_FILE_PATTERN);
    const filename = getFilename(context);

    if (!isTestFile(filename)) {
      debug(`skipping non-test file '${filename}'`);
      return {};
    }

    let program: TSESTree.Program | null = null;
    // Creations that are shared across every test unless a sibling `beforeEach`
    // re-creates a fresh instance.
    const candidates: Candidate[] = [];
    // Containers (`describe` callbacks or the module) whose tests DO get a fresh
    // instance because a `beforeEach` in them re-creates one.
    const freshContainers = new Set<Container>();

    return {
      CallExpression(node: TSESTree.CallExpression) {
        const name = getRootCalleeName(node.callee);
        if (name == null || !factories.has(name) || program == null)
          return;

        const enclosing = nearestFunction(node);

        // A factory call inside a `beforeEach` produces a fresh instance per
        // test. Mark the container that owns that `beforeEach` as safe. Only
        // `beforeEach` counts: `beforeAll` runs once, so reusing its instance
        // still leaks state between tests.
        if (enclosing != null && isBeforeEachCallback(enclosing)) {
          freshContainers.add(nearestFunction(enclosing) ?? program);
          return;
        }

        // A creation living directly in a `describe` body (or at module scope)
        // is shared across every test; anything else (inside `it`, an
        // `afterEach`, or a helper) is per-call and left alone.
        if (enclosing != null && !isDescribeCallback(enclosing))
          return;

        candidates.push({
          atModuleScope: enclosing == null,
          container: enclosing ?? program,
          factory: name,
          node,
        });
      },
      Program(node: TSESTree.Program) {
        program = node;
      },
      'Program:exit': function () {
        // A `beforeEach` in an ancestor `describe` (or at module scope) runs
        // before every test in nested suites, so it protects a creation in a
        // descendant container too. Walk up the nesting looking for any fresh
        // ancestor. Safety only propagates downward: a child `beforeEach` never
        // protects a parent-scoped creation.
        const isProtected = (container: Container): boolean => {
          let current: Container | null = container;
          while (current != null) {
            if (freshContainers.has(current))
              return true;
            if (current.type === 'Program')
              break;
            current = nearestFunction(current) ?? program;
          }
          return false;
        };

        for (const candidate of candidates) {
          if (isProtected(candidate.container))
            continue;

          debug(`found shared pinia via '${candidate.factory}' ${candidate.atModuleScope ? 'at module scope' : 'in describe body'}`);

          context.report({
            data: {
              factory: candidate.factory,
              location: candidate.atModuleScope ? 'at module scope' : 'in the `describe` body',
            },
            messageId: 'sharedPinia',
            node: candidate.node,
          });
        }
      },
    };
  },
  defaultOptions: [
    {
      factories: DEFAULT_FACTORIES,
      testFilePattern: DEFAULT_TEST_FILE_PATTERN,
    },
  ],
  meta: {
    docs: {
      description: 'disallow a Pinia instance shared across tests via `describe`-body or module scope',
      recommendation: 'recommended',
    },
    messages: {
      sharedPinia: '`{{ factory }}()` is called {{ location }}, so the Pinia instance is shared across every test and store state leaks between them. Create a fresh instance per test with `beforeEach(() => setActivePinia(createPinia()))`, or add an inline disable if the shared instance is intentional.',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          factories: {
            items: { type: 'string' },
            type: 'array',
          },
          testFilePattern: {
            type: 'string',
          },
        },
        type: 'object',
      },
    ],
    type: 'problem',
  },
  name: RULE_NAME,
});
