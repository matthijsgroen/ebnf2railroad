module.exports = {
  env: { node: true },
  parserOptions: { ecmaVersion: 2018 },
  plugins: ["prettier"],
  extends: ["eslint:recommended"],
  rules: {
    "prettier/prettier": ["error"]
  }
};
