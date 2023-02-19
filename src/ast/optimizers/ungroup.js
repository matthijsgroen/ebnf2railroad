const { NodeTypes } = require("../ebnf-transform");

module.exports = {
  [NodeTypes.Group]: (current, node, parents) => {
    if (parents[0].sequence && current.group.choice) {
      return current;
    }
    if (current.comment) {
      return current;
    }
    return current.group;
  },
  [NodeTypes.Sequence]: (current) => {
    if (!current.sequence) return current;
    const hasSubSequence = current.sequence.some((node) => node.sequence);
    if (hasSubSequence) {
      return {
        ...current,
        sequence: current.sequence.reduce(
          (items, elem) =>
            elem.sequence ? items.concat(elem.sequence) : items.concat(elem),
          []
        ),
      };
    }
    if (current.sequence.length === 1) {
      return current.sequence[0];
    }
    return current;
  },
  [NodeTypes.Choice]: (current) => {
    const hasSubChoice = current.choice.some((node) => node.choice);
    if (hasSubChoice) {
      return {
        ...current,
        choice: current.choice.reduce(
          (items, elem) =>
            elem.choice ? items.concat(elem.choice) : items.concat(elem),
          []
        ),
      };
    }
    return current;
  },
};
