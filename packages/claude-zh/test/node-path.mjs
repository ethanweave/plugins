// Bun's test runner sets process.execPath to Bun itself. Tests that exercise
// Node-only CLI behavior still need the Node executable the host requires.
export const nodeExecutable = process.versions.bun
  ? (process.env.CLAUDE_ZH_NODE || 'node')
  : process.execPath;
