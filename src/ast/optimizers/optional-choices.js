const { NodeTypes } = require("../ebnf-transform");

module.exports = {
  [NodeTypes.Choice]: (current) => {
    if (!current.choice) {
      return current;
    }
    const hasOptional = current.choice.some((node) => node.optional);
    if (hasOptional) {
      return {
        optional: {
          choice: current.choice.reduce(
            (options, option) =>
              option.optional
                ? options.concat(option.optional)
                : options.concat(option),
            []
          ),
        },
      };
    }
    return current;
  },
};
