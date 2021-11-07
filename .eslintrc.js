/** @format */

module.exports = {
    parser: '@typescript-eslint/parser', // Specifies the ESLint parser
    extends: ['universe/node', 'prettier'],
    plugins: ['prettier', 'unused-imports', 'import'],
    rules: {
        'prettier/prettier': 'error',

        'unused-imports/no-unused-imports': 'error',

        'import/order': [
            'error',
            {
                'newlines-between': 'always',
                groups: ['builtin', 'external', 'parent', 'sibling', 'index'],
            },
        ],
        '@typescript-eslint/semi': 'warn',
        curly: 'warn',
        eqeqeq: 'warn',
        'no-throw-literal': 'warn',
    },
};
