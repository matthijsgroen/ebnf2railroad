module.exports = {
  env: { node: true },
  parserOptions: { ecmaVersion: 2018 },
  plugins: ["prettier"],
  extends: ["eslint:recommended"],
  rules: {
    semi: ["error", "always"],
    quotes: ["error", "double"]
  }
};
