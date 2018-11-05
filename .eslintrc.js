module.exports = {
  env: { node: true },
  parserOptions: { ecmaVersion: 2018 },
  plugins: ["prettier", "mocha"],
  extends: ["eslint:recommended"],
  rules: {
    "arrow-body-style": ["error", "as-needed"],
    "prettier/prettier": "error",
    "mocha/no-exclusive-tests": "error"
  }
};
