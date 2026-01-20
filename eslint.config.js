import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import i18next from 'eslint-plugin-i18next'
import { importX } from 'eslint-plugin-import-x'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tseslint from 'typescript-eslint'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
      jsxA11y.flatConfigs.strict,
      reactPlugin.configs.flat.recommended,
      reactPlugin.configs.flat['jsx-runtime'],
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      i18next.configs['flat/recommended']
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname
      }
    },
    settings: {
      react: {
        version: 'detect'
      },
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json'
        }
      }
    },
    rules: {
      // Catch components defined inside render that cause state loss
      'react/no-unstable-nested-components': 'warn',
      // Catch new objects/arrays in context providers causing unnecessary re-renders
      'react/jsx-no-constructed-context-values': 'warn',
      // Catch {count && <Component />} rendering "0" when count is 0
      'react/jsx-no-leaked-render': 'warn',
      // Catch default props like { items = [] } creating new references each render
      'react/no-object-type-as-default-prop': 'warn',
      // Catch controlled inputs missing onChange or readOnly
      'react/checked-requires-onchange-or-readonly': 'warn',
      // Security: prevent javascript: URLs
      'react/jsx-no-script-url': 'error',
      // Catch array index as key which causes bugs on reorder/delete
      'react/no-array-index-key': 'warn',
      'no-nested-ternary': 'error',
      'import-x/no-dynamic-require': 'warn',
      'import-x/no-nodejs-modules': 'error',
      'import-x/order': [
        'warn',
        {
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always',
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type'
          ],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after'
            }
          ],
          pathGroupsExcludedImportTypes: ['builtin']
        }
      ]
    }
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      // Allow shadcn/ui components to keep literal strings and exports.
      'i18next/no-literal-string': 'off',
      'react-refresh/only-export-components': 'off'
    }
  },
  {
    files: ['vite.config.ts', 'eslint.config.js', 'scripts/**/*.{js,ts}'],
    rules: {
      // Permit Node.js builtins in tooling and config files.
      'import-x/no-nodejs-modules': 'off'
    }
  },
  {
    files: ['api/**/*.{ts,tsx}', 'src/server/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.node
    },
    rules: {
      // Permit Node.js builtins in server-side code.
      'import-x/no-nodejs-modules': 'off',
      // Server code doesn't need React Refresh
      'react-refresh/only-export-components': 'off',
      // Server code doesn't need i18n
      'i18next/no-literal-string': 'off'
    }
  },
  {
    files: ['src/__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly'
      }
    },
    rules: {
      // Test files don't need i18n
      'i18next/no-literal-string': 'off',
      // Test files can export test utilities
      'react-refresh/only-export-components': 'off',
      // Allow non-null assertions in tests for cleaner assertions
      '@typescript-eslint/no-non-null-assertion': 'off'
    }
  },
  // turn off prettier rules that conflict with eslint rules
  eslintConfigPrettier
])
