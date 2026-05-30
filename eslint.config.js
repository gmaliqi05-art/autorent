import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'playwright-report', 'test-results', 'e2e'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // `any` është inevitable kur punojme me payload-e te Supabase (response data PostgrestResponse),
      // event handlers DOM dhe biblioteka te jashtme pa types. Mbahet warning per visibility por
      // jo error qe te bllokoje CI/dev flow.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Supabase Edge Functions (Deno runtime): Stripe SDK + Resend SDK + Deno globals
  // nuk kane type definitions te plota — `any` lejohet eksplicit ne kete kontekst.
  {
    files: ['supabase/functions/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  }
);
