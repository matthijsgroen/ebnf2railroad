const { travelers, identifyNode, NodeTypes } = require("./ast/ebnf-transform");
const { traverse } = require("./ast/traverse");
const { optimizeAST } = require("./structure-optimizer");

const {
  choice,
  comment,
  commentWithLine,
  diagram,
  group,
  horizontalChoice,
  nonTerminal,
  optional,
  repeater,
  sequence,
  skip,
  stack,
  terminal,
} = require("utf-railroad");

const ExtraNodeTypes = {
  Skip: 100,
};

const MAX_CHOICE_LENGTH = 10;

const identity = (x) => x;
const dot = (f) => (g) => (x) => f(g(x));

const diagramTraverse = traverse((node) => {
  const result = identifyNode(node);
  if (result !== undefined) return result;
  if (node.skip) return ExtraNodeTypes.Skip;
})({
  ...travelers,
  [NodeTypes.Repetition]: (node, next) => ({
    ...node,
    repetition: next(node.repetition),
    ...(node.repeater && { repeater: next(node.repeater) }),
  }),
});

const baseDiagramRendering = {
  [NodeTypes.Production]: (node) => diagram(node.definition, node.complex),
  [NodeTypes.ExceptNonTerminal]: (node) =>
    nonTerminal(`${node.include} - ${node.exceptNonTerminal}`),
  [NodeTypes.ExceptTerminal]: (node) =>
    nonTerminal(`${node.include} - ${node.exceptTerminal}`),
  [NodeTypes.Terminal]: (node) => terminal(node.terminal),
  [NodeTypes.NonTerminal]: (node) => nonTerminal(node.nonTerminal),
  [NodeTypes.Special]: (node) => {
    const sequence = nonTerminal(" " + node.specialSequence + " ");
    return sequence;
  },
  [NodeTypes.Choice]: (node) => choice(node.choice, 0),
  [NodeTypes.Sequence]: (node) => sequence(node.sequence),
  [NodeTypes.Comment]: (node) => commentWithLine(node.comment),
  [NodeTypes.Group]: (node, production) => {
    if (node.comment) {
      const commentOnOptional = production.group && production.group.optional;
      if (commentOnOptional) {
        return choice([commentWithLine(node.comment), node.group.items[1]], 0);
      }
      return node.group
        ? sequence([node.group, commentWithLine(node.comment)])
        : commentWithLine(node.comment);
    }

    return node.group;
  },
  [NodeTypes.Optional]: (node) => optional(node.optional),
  [ExtraNodeTypes.Skip]: () => skip(),
  [NodeTypes.Repetition]: (node) => {
    if (node.skippable === true) {
      return choice([skip(), repeater(node.repetition)], 1);
    }
    if (node.skippable === false) {
      return node.repeater
        ? repeater(node.repetition, node.repeater)
        : repeater(node.repetition);
    }
    if (node.amount !== undefined) {
      return repeater(node.repetition, comment(`${node.amount} ×`));
    }
  },
};

const maxChoiceLength = (max) => ({
  [NodeTypes.Choice]: (node) => {
    const makeChoice = (items) => choice(items, 0);
    const choiceOptions = node.items;
    const choiceLists = [];
    while (choiceOptions.length > max) {
      const subList = choiceOptions.splice(0, max);
      choiceLists.push(makeChoice(subList));
    }
    choiceLists.push(makeChoice(choiceOptions));
    return choiceLists.length > 1
      ? horizontalChoice(choiceLists)
      : choiceLists[0];
  },
});

const optimizeSequenceLength = {
  [NodeTypes.Sequence]: (node) => {
    if (node.width > 450) {
      const subSequences = node.items
        .reduce(
          (totals, elem, index, list) => {
            const lastList = totals.slice(-1)[0];
            lastList.push(elem);
            const currentLength = lastList.reduce(
              (acc, item) => acc + item.width,
              0
            );
            const remainingLength = list
              .slice(index + 1)
              .reduce((acc, item) => acc + item.width, 0);
            if (
              currentLength + remainingLength > 400 &&
              currentLength >= 250 &&
              remainingLength > 100
            ) {
              totals.push([]);
            }
            return totals;
          },
          [[]]
        )
        .filter((array) => array.length > 0);
      return stack(subSequences.map((subSequence) => sequence(subSequence)));
    }
    return node;
  },
};

const createDiagram = (production, metadata, ast, options) => {
  const expanded = [];

  const renderDiagram = dot(
    diagramTraverse(
      [
        baseDiagramRendering,
        options.optimizeDiagrams && maxChoiceLength(MAX_CHOICE_LENGTH),
        options.diagramWrap &&
          options.optimizeDiagrams &&
          optimizeSequenceLength,
        options.overview && {
          [NodeTypes.NonTerminal]: (node, production) => {
            const expand =
              !expanded.includes(production.nonTerminal) &&
              metadata[production.nonTerminal] &&
              !metadata[production.nonTerminal].characterSet;

            const nested = ast.find(
              (item) => item.identifier === production.nonTerminal
            );
            if (!expand || !nested) {
              return node;
            }
            expanded.push(production.nonTerminal);

            return group(
              renderDiagram(nested.definition),
              production.nonTerminal
            );
          },
        },
      ].filter(Boolean)
    )
  )(options.optimizeDiagrams === false ? identity : optimizeAST);

  const diagram = renderDiagram({
    ...production,
    complex: options.complex,
  });

  return diagram;
};

module.exports = {
  createDiagram,
};
