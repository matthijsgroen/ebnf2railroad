const { NodeTypes } = require("../ebnf-transform");

const canMerge = node =>
  node.choice.some(item => item.group && item.group.choice);

module.exports = {
  [NodeTypes.Choice]: current =>
    canMerge(current)
      ? {
          ...current,
          choice: current.choice.reduce(
            (acc, elem) =>
              elem.group && elem.group.choice
                ? acc.concat(elem.group.choice)
                : acc.concat(elem),
            []
          )
        }
      : current
};
