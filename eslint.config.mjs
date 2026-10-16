import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// Next 16 removed `next lint`, so the rules that subcommand supplied are wired
// up here instead. eslint-config-next 16 ships flat configs directly, so there
// is no FlatCompat shim in the way.
const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // A curriculum has modules, so `for (const module of ...)` is this
      // project's own vocabulary and reads correctly. The rule exists to catch
      // assignment to the CommonJS `module` global inside a page bundle; a
      // block-scoped loop variable is not that. It fired five times, every one
      // a false positive, in lib/curriculum.ts, worker/index.ts and
      // app/work/curriculums/Curriculums.tsx.
      "@next/next/no-assign-module-variable": "off",
    },
  },
  {
    rules: {
      // `_indexed` and friends are deliberately-unused bindings. The underscore
      // is the convention the code already uses, so teach the rule about it
      // rather than deleting a name that documents a position.
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
    },
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      ".wrangler/**",
      "public/**",
      "scripts/**",
    ],
  },
];

export default config;
