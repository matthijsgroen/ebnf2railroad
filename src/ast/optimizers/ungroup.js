const { NodeTypes } = require("../ebnf-transform");

const ungroup = elem =>
  elem.group && !elem.comment && !elem.group.choice
    ? ungroup(elem.group)
    : elem;

module.exports = { [NodeTypes.Group]: current => ungroup(current) };
