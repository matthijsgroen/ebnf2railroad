const { traverse } = require("./traverse");

const NodeTypes = {
  Root: 0,
  Production: 1,
  Comment: 2,
  Terminal: 3,
  NonTerminal: 4,
  Choice: 5,
  Group: 6,
  Sequence: 7,
  Optional: 8,
  Repetition: 9,
  Special: 10
};

const identifyNode = node => {
  if (Array.isArray(node)) return NodeTypes.Root;
  if (node.definition) return NodeTypes.Production;
  if (node.terminal) return NodeTypes.Terminal;
  if (node.nonTerminal) return NodeTypes.NonTerminal;
  if (node.choice) return NodeTypes.Choice;
  if (node.group) return NodeTypes.Group;
  if (node.comment) return NodeTypes.Comment;
  if (node.sequence) return NodeTypes.Sequence;
  if (node.optional) return NodeTypes.Optional;
  if (node.repetition) return NodeTypes.Repetition;
  if (node.specialSequence) return NodeTypes.Special;
};

const ebnfTransform = traverse(identifyNode)({
  [NodeTypes.Root]: (node, next) => node.map(next),
  [NodeTypes.Production]: (node, next) => ({
    ...node,
    definition: next(node.definition)
  }),
  [NodeTypes.Choice]: (node, next) => ({
    ...node,
    choice: node.choice.map(next)
  }),
  [NodeTypes.Group]: (node, next) => ({
    ...node,
    group: next(node.group)
  }),
  [NodeTypes.Sequence]: (node, next) => ({
    ...node,
    sequence: node.sequence.map(next)
  }),
  [NodeTypes.Optional]: (node, next) => ({
    ...node,
    optional: next(node.optional)
  }),
  [NodeTypes.Repetition]: (node, next) => ({
    ...node,
    repetition: next(node.repetition)
  })
});

module.exports = { ebnfTransform, NodeTypes };
