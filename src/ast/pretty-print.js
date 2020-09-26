const { ebnfTransform, NodeTypes } = require("./ebnf-transform");

const prettyPrint = ebnfTransform([
  {
    [NodeTypes.Root]: a => a.join("\n"),
    [NodeTypes.Production]: a => `${a.identifier} = ${a.definition} ;`,
    [NodeTypes.Terminal]: a => `"${a.terminal}"`,
    [NodeTypes.NonTerminal]: a => `${a.nonTerminal}`,
    [NodeTypes.Choice]: a => a.choice.join(" | "),
    [NodeTypes.Comment]: a => `(*${a.comment}*)`,
    [NodeTypes.Group]: a =>
      a.comment ? `${a.group} (*${a.comment}*)` : `( ${a.group} )`,
    [NodeTypes.Sequence]: a => a.sequence.join(" , "),
    [NodeTypes.Optional]: a => `[ ${a.optional} ]`,
    [NodeTypes.Repetition]: a => `{ ${a.repetition} }`,
    [NodeTypes.Special]: a => `? ${a.specialSequence} ?`
  }
]);

module.exports = { prettyPrint };
