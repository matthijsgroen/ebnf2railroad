const { NodeTypes } = require("../ebnf-transform");

module.exports = {
  [NodeTypes.Choice]: (current) => {
    if (!current.choice) {
      return current;
    }
    const stringChoices = current.choice.map((item) => JSON.stringify(item));
    const uniqueDirectChoices = current.choice.filter(
      (item, idx) => !(stringChoices.indexOf(JSON.stringify(item)) < idx)
    );

    const stringChoicesComments = current.choice.map((item) =>
      item.group && item.comment ? JSON.stringify(item.group) : null
    );
    const uniqueChoices = uniqueDirectChoices.filter(
      (item) =>
        (!item.comment &&
          stringChoicesComments.indexOf(JSON.stringify(item)) === -1) ||
        item.comment
    );

    if (uniqueChoices.length === 1) {
      return current.choice[0];
    }
    if (uniqueChoices.length < current.choice.length) {
      return { ...current, choice: uniqueChoices };
    }
    return current;
  },
};
