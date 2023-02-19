const { parse } = require("./ebnf-parser");
const { createDocumentation, documentStyle } = require("./html-report-builder");
const {
  createDocumentation: createMarkdownDocumentation,
} = require("./markdown-report-builder");
const { validateEbnf } = require("./validate");
const { version } = require("../package.json");
const {
  getReferences,
  searchReferencesFromIdentifier,
  searchReferencesToIdentifier,
} = require("./references");

const improveErrors = (parser) => (input) => {
  try {
    return parser(input);
  } catch (e) {
    const error = new Error(e.message);
    if (e.hash) {
      error.hash = e.hash; // backwards compatibility
      error.data = {
        expected: e.hash.expected,
        token: `'${e.hash.token[0]}'`,
        line: e.hash.line + 1,
        pos: e.hash.loc.last_column + 1,
      };
    }
    throw error;
  }
};

module.exports = {
  version,
  parseEbnf: improveErrors(parse),
  createDocumentation,
  createMarkdownDocumentation,
  documentStyle,
  validateEbnf,
  getReferences,
  searchReferencesFromIdentifier,
  searchReferencesToIdentifier,
};
