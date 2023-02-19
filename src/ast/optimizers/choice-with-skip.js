const { NodeTypes } = require("../ebnf-transform");

module.exports = {
  [NodeTypes.Optional]: (current) => {
    if (!current.optional || !current.optional.choice) {
      return current;
    }
    return {
      choice: [{ skip: true }].concat(
        current.optional.choice
          .filter((node) => !node.skip)
          .map((node) =>
            node.repetition ? { ...node, skippable: false } : node
          )
      ),
    };
  },
  [NodeTypes.Choice]: (current) => {
    if (!current.choice) {
      return current;
    }
    const hasSkippableRepetition = current.choice.some(
      (node) => node.repetition && node.skippable
    );
    if (hasSkippableRepetition) {
      return {
        choice: [{ skip: true }].concat(
          current.choice
            .filter((node) => !node.skip)
            .map((node) =>
              node.repetition ? { ...node, skippable: false } : node
            )
        ),
      };
    }
    return current;
  },
};
