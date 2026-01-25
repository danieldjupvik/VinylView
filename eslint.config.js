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
      tseslint.configs.strictTypeChecked,
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
      },
      'jsx-a11y': {
        // Map shadcn/ui components to native HTML elements for a11y checks.
        // Update when adding new shadcn components that wrap: button, input, img, label, select, a
        components: {
          Button: 'button',
          Input: 'input',
          Label: 'label',
          Checkbox: 'input',
          Select: 'select',
          Slider: 'input',
          AvatarImage: 'img'
        }
      }
    },
    rules: {
      // Report exports that are not used anywhere in the codebase
      'import-x/no-unused-modules': [
        'error',
        {
          unusedExports: true,
          // Ignore type-only exports (they're for type contracts, not runtime)
          ignoreUnusedTypeExports: true,
          // Ignore entry points, config files, and files used externally
          ignoreExports: [
            'src/main.tsx',
            'src/routeTree.gen.ts',
            'src/providers/**/*.tsx', // Providers are used in provider tree
            'api/**/*.ts', // Vercel serverless functions
            'src/server/**/*.ts', // Server-side code consumed by API
            'vite.config.ts',
            'eslint.config.js'
          ]
        }
      ],
      // Require explicit return types on exported functions for better documentation
      '@typescript-eslint/explicit-module-boundary-types': [
        'warn',
        {
          allowArgumentsExplicitlyTypedAsAny: false,
          allowDirectConstAssertionInArrowFunctions: true,
          allowHigherOrderFunctions: true,
          allowTypedFunctionExpressions: true
        }
      ],
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
      // Detect circular dependencies (A imports B, B imports A)
      'import-x/no-cycle': 'error',
      // Prevent a module from importing itself
      'import-x/no-self-import': 'error',
      // Prevent exporting mutable variables (let)
      'import-x/no-mutable-exports': 'error',
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
      'react-refresh/only-export-components': 'off',
      // shadcn/ui components are generated, don't require explicit return types
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // shadcn/ui exports are consumed by app code, not internal
      'import-x/no-unused-modules': 'off'
    }
  },
  {
    files: ['vite.config.ts', 'eslint.config.js', 'scripts/**/*.{js,ts}'],
    rules: {
      // Permit Node.js builtins in tooling and config files.
      'import-x/no-nodejs-modules': 'off',
      // Config files don't need explicit return types
      '@typescript-eslint/explicit-module-boundary-types': 'off'
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
  // turn off prettier rules that conflict with eslint rules
  eslintConfigPrettier
])
