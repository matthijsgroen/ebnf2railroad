const { NodeTypes } = require("../ebnf-transform");

module.exports = {
  [NodeTypes.Optional]: current => {
    if (current.optional.repetition || current.optional.optional) {
      return current.optional;
    }
    return current;
  }
};
