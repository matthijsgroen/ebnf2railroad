const { NodeTypes } = require("../ebnf-transform");

module.exports = {
  [NodeTypes.Choice]: current => {
    const stringChoices = current.choice.map(item => JSON.stringify(item));

    const uniqueChoices = current.choice.filter(
      (item, idx) => !(stringChoices.indexOf(JSON.stringify(item)) < idx)
    );
    if (uniqueChoices.length === 1) {
      return current.choice[0];
    }
    return current;
  }
};
