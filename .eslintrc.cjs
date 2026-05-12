module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:jsdoc/recommended',
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    rules: {
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single', { avoidEscape: true }],
        'semi': ['error', 'always'],
        'comma-dangle': ['error', 'always-multiline'],
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'max-lines': ['error', 500],
        'max-lines-per-function': ['error', 60],
        'max-depth': ['error', 5],
        'complexity': ['error', 10],
        'import/no-restricted-paths': [
            'error',
            {
                zones: [
                    {
                        target: './src/domain',
                        from: './src/!(domain)',
                        message: 'domain layer must not import from other layers',
                    },
                    {
                        target: './src/application',
                        from: './src/!(application|domain)',
                        message: 'application layer must not import from infrastructure or ui',
                    },
                    {
                        target: './src/!(infrastructure)',
                        from: './src/infrastructure',
                        message: 'only infrastructure layer may import from infrastructure',
                    },
                    {
                        target: './src/!(ui)',
                        from: './src/ui',
                        message: 'only ui layer may import from ui',
                    },
                ],
            },
        ],
        'jsdoc/require-jsdoc': [
            'error',
            {
                require: {
                    FunctionDeclaration: true,
                    MethodDefinition: true,
                    ClassDeclaration: true,
                    ArrowFunctionExpression: false,
                    FunctionExpression: false,
                },
            },
        ],
        'jsdoc/require-file-overview': ['error'],
        'jsdoc/tag-lines': ['error', 'any', { startLines: 1 }],
        'no-multiple-empty-lines': ['error', { max: 1 }],
    },
};
