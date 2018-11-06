const { parser } = require("./ebnf-parser");
const {
  createDocumentation,
  documentStyle,
  validateEbnf
} = require("./report-builder");
const { version } = require("../package.json");

module.exports = {
  version,
  createDocumentation,
  documentStyle,
  validateEbnf
};
