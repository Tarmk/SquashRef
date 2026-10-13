import { defineConfig } from 'vitest/config';

// Firestore security rules tests. They need the Firestore emulator, so they run
// through `npm run test:rules` (firebase emulators:exec), not `npm test`.
export default defineConfig({
  test: { include: ['rules/**/*.test.ts'], testTimeout: 20000, hookTimeout: 30000, fileParallelism: false },
});
