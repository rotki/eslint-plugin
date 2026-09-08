import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule from '../../src/rules/no-leading-body-comment';

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    parserOptions: {
      ecmaVersion: 2020,
      parser: '@typescript-eslint/parser',
      sourceType: 'module',
    },
  },
});

tester.run('no-leading-body-comment', rule, {
  valid: [
    {
      filename: 'test.ts',
      code: `
/** Reads the port the service actually bound. */
function selectPort() {
  return bound;
}
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
function useNamesApi() {
  /**
   * Reverse-resolves ENS names, synchronously or as a backend task.
   */
  const internal = async () => post('/names/ens/reverse');
  return { internal };
}
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
function withInnerFunction() {
  /** Formats one child line. */
  function emit(buffer) {
    return buffer.toString();
  }
  return emit;
}
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
function guarded() {
  // eslint-disable-next-line no-console -- the reporter writes here on purpose
  console.log('ready');
}
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
const noop = () => {
  // Nothing to do: the caller only needs the handle.
};
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
function trailing() {
  const timeout = 5000; // milliseconds
  return timeout;
}
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
function midBody() {
  const port = resolve();
  // Only reached once the port is known.
  return connect(port);
}
      `.trim(),
    },
    {
      filename: 'test.spec.ts',
      code: `
describe('useThing', () => {
  /**
   * A paragraph introducing the test below it belongs to the title, which is a separate
   * question from this rule's.
   */
  it('should do the thing', () => {
    expect(thing()).toBe(true);
  });
});
      `.trim(),
    },
    {
      filename: 'test.spec.ts',
      code: `
describe('useThing', () => {
  // A comment opening the suite is about the tests, not about the describe arrow.
  it('should do the thing', () => {
    expect(thing()).toBe(true);
  });
});
      `.trim(),
    },
    {
      filename: 'test.spec.ts',
      code: `
beforeEach(() => {
  // \`createSharedComposable\` keeps one instance per module, so each test needs a fresh module.
  vi.resetModules();
});
      `.trim(),
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      code: `
function spawnProxyForBackend(instance, corePort) {
  /* The dev-proxy sits between starling and core, so only \`/api/1/*\` is routed through it. */
  startDevProxy({ BACKEND: corePort });
}
      `.trim(),
      errors: [{ messageId: 'body' }],
    },
    {
      filename: 'test.ts',
      code: `
function parseToken(url) {
  // Parse the OAuth callback URL
  return new URL(url);
}
      `.trim(),
      errors: [{ messageId: 'body' }],
    },
    {
      filename: 'test.ts',
      code: `
function documented() {
  // The persistence layer still speaks the old vocabulary; translate once.
  const translated = translate(stored);
  return translated;
}
      `.trim(),
      errors: [{ messageId: 'body' }],
    },
    {
      filename: 'test.ts',
      code: `
class Manager {
  cleanup() {
    // Remove startup error IPC handlers
    this.handlers.clear();
  }
}
      `.trim(),
      errors: [{ messageId: 'body' }],
    },
    {
      filename: 'test.spec.ts',
      code: `
it('should fall back to index.html for the bare origin', async () => {
  // sanitizePath strips the traversal, so the request resolves inside baseDir instead.
  const response = await handler(request('/'));
  expect(response.status).toBe(200);
});
      `.trim(),
      errors: [{ messageId: 'testBody' }],
    },
    {
      filename: 'test.spec.ts',
      code: `
it.each([1, 2])('should handle %s', async (value) => {
  // Regression: the cursor was keyed on the full url in one branch.
  expect(value).toBeDefined();
});
      `.trim(),
      errors: [{ messageId: 'testBody' }],
    },
    {
      filename: 'test.spec.ts',
      code: `
test('login', async () => {
  /* After logout we are already on the login page with animations disabled. */
  await page.goto('/');
});
      `.trim(),
      errors: [{ messageId: 'testBody' }],
    },
    {
      filename: 'test.ts',
      code: `
watch(source, () => {
  // The echo of our own write: skip re-applying state we already hold.
  if (isEcho(source))
    return;
  apply(source);
});
      `.trim(),
      errors: [{ messageId: 'callback' }],
    },
    {
      filename: 'test.ts',
      code: `
export async function setupPremium() {
  /**
   * If setup has run already no need to do it again
   */
  if (!window.Vue) {
    window.Vue = Vue;
  }
}
      `.trim(),
      errors: [{ messageId: 'body' }],
    },
  ],
});
