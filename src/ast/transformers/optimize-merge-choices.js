const { NodeTypes } = require("../ebnf-transform");

module.exports = {
  [NodeTypes.Choice]: current => ({
    ...current,
    choice: current.choice.reduce(
      (acc, elem) =>
        elem.group && elem.group.choice
          ? acc.concat(elem.group.choice)
          : acc.concat(elem),
      []
    )
  })
};
