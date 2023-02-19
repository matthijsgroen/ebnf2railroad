const { NodeTypes } = require("../ebnf-transform");

module.exports = {
  [NodeTypes.Optional]: (current) => {
    if (current.optional.optional) {
      return current.optional;
    }
    if (current.optional.repetition && current.optional.skippable) {
      return current.optional;
    }
    return current;
  },
};
