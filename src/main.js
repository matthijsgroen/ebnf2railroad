const { parse } = require("./ebnf-parser");
const {
  createDocumentation,
  documentStyle,
  validateEbnf
} = require("./report-builder");
const { version } = require("../package.json");
const {
  getReferences,
  searchReferencesFromIdentifier,
  searchReferencesToIdentifier
} = require("./references");

module.exports = {
  version,
  parseEbnf: parse,
  createDocumentation,
  documentStyle,
  validateEbnf,
  getReferences,
  searchReferencesFromIdentifier,
  searchReferencesToIdentifier
};
