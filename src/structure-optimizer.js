const { ebnfOptimizer } = require("./ast/ebnf-transform");
const ungroup = require("./ast/optimizers/ungroup");
const deduplicateChoices = require("./ast/optimizers/deduplicate-choices");
const unwrapOptional = require("./ast/optimizers/unwrap-optional");
const optionalChoices = require("./ast/optimizers/optional-choices");
const choiceWithSkip = require("./ast/optimizers/choice-with-skip");
const repetition = require("./ast/optimizers/repetition");
const choiceClustering = require("./ast/optimizers/choice-clustering");

const optimizeAST = ebnfOptimizer([
  ungroup,
  deduplicateChoices,
  unwrapOptional,
  optionalChoices,
  choiceWithSkip,
  repetition,
  choiceClustering,
]);

const optimizeText = ebnfOptimizer([
  ungroup,
  deduplicateChoices,
  unwrapOptional,
  optionalChoices,
]);

module.exports = {
  optimizeAST,
  optimizeText,
};
