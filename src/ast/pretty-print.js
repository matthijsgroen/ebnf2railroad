const { ebnfTransform, NodeTypes } = require("./ebnf-transform");

const prettyPrint = ebnfTransform([
  {
    [NodeTypes.Root]: (a, b) => b.join("\n"),
    [NodeTypes.Production]: (a, b) => `${b.identifier} = ${b.definition} ;`,
    [NodeTypes.Terminal]: a => `"${a.terminal}"`,
    [NodeTypes.NonTerminal]: a => `${a.nonTerminal}`,
    [NodeTypes.Choice]: (a, b) => b.choice.join(" | "),
    [NodeTypes.Comment]: a => `(*${a.comment}*)`,
    [NodeTypes.Group]: (a, b) =>
      a.comment ? `${b.group} (*${a.comment}*)` : `( ${b.group} )`,
    [NodeTypes.Sequence]: (a, b) => b.sequence.join(" , "),
    [NodeTypes.Optional]: (a, b) => `[ ${b.optional} ]`,
    [NodeTypes.Repetition]: (a, b) => `{ ${b.repetition} }`,
    [NodeTypes.Special]: a => `? ${a.specialSequence} ?`
  }
]);

const collectTerminals = ast => {
  const terminals = [];
  ebnfTransform([
    {
      [NodeTypes.Terminal]: a => terminals.push(a)
    }
  ])(ast);
  return terminals;
};

module.exports = { prettyPrint, collectTerminals };
