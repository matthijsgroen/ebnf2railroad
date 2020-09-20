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

const ebnfTransform = transformers => ast => {
  const traveler = traverse(node => {
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
  });

  traveler.addTraveler(NodeTypes.Root, (node, next) => node.map(next));
  traveler.addTraveler(NodeTypes.Production, (node, next) => ({
    ...node,
    definition: next(node.definition)
  }));
  traveler.addTraveler(NodeTypes.Choice, (node, next) => ({
    ...node,
    choice: node.choice.map(next)
  }));
  traveler.addTraveler(NodeTypes.Group, (node, next) => ({
    ...node,
    group: next(node.group)
  }));
  traveler.addTraveler(NodeTypes.Sequence, (node, next) => ({
    ...node,
    sequence: node.sequence.map(next)
  }));
  traveler.addTraveler(NodeTypes.Optional, (node, next) => ({
    ...node,
    optional: next(node.optional)
  }));
  traveler.addTraveler(NodeTypes.Repetition, (node, next) => ({
    ...node,
    repetition: next(node.repetition)
  }));

  transformers.forEach(transformer => traveler.addTransform(transformer));
  return traveler.transform(ast);
};

module.exports = { ebnfTransform, NodeTypes };
