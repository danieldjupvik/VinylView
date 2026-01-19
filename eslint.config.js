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
      reactPlugin.configs.flat.all,
      reactPlugin.configs.flat['jsx-runtime'],
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite
    ],
    plugins: {
      'import-x': importX,
      i18next
    },
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
      }
    },
    rules: {
      // Avoid noisy displayName requirements for inline/test components.
      'react/display-name': 'off',
      // Trim strict React style rules that force formatting-only changes.
      'react/jsx-indent': 'off',
      'react/jsx-indent-props': 'off',
      'react/jsx-filename-extension': 'off',
      'react/jsx-max-depth': 'off',
      'react/jsx-max-props-per-line': 'off',
      'react/jsx-sort-props': 'off',
      'react/jsx-newline': 'off',
      'react/jsx-wrap-multilines': 'off',
      'react/jsx-curly-newline': 'off',
      'react/jsx-one-expression-per-line': 'off',
      'react/forbid-component-props': 'off',
      'react/jsx-no-bind': 'off',
      'react/no-unstable-nested-components': 'off',
      'react/self-closing-comp': 'off',
      'react/jsx-boolean-value': 'off',
      'react/prefer-read-only-props': 'off',
      'react/no-multi-comp': 'off',
      // Avoid noisy rules that conflict with TS typing or JSX patterns.
      'react/jsx-props-no-spreading': 'off',
      'react/require-default-props': 'off',
      'react/jsx-no-literals': 'off',
      'react/function-component-definition': 'off',
      'import-x/no-dynamic-require': 'warn',
      'import-x/no-nodejs-modules': 'warn',
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
      ],
      'i18next/no-literal-string': 'error'
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
  // turn off prettier rules that conflict with eslint rules
  eslintConfigPrettier
])
