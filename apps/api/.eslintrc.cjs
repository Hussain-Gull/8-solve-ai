module.exports = {
  root: true,
  extends: ["@ai-saas-admin/config/eslint"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"]
  },
  env: { node: true, jest: true }
};


