const { travelers, identifyNode, NodeTypes } = require("./ast/ebnf-transform");
const { traverse } = require("./ast/traverse");
const { optimizeAST } = require("./structure-optimizer");
const {
  Comment,
  ComplexDiagram,
  Diagram,
  HorizontalChoice,
  NonTerminal,
  OneOrMore,
  Sequence,
  Skip,
  Stack,
  Terminal,
} = require("railroad-diagrams");
const { CommentWithLine, Group, Choice } = require("./extra-diagram-elements");

/**
 * Replaces one or multiple spaces with a dash
 *
 * @param {string} str
 * @returns {string}
 */
const dasherize = (str) => str.replace(/\s+/g, "-");

const ExtraNodeTypes = {
  Skip: 100,
};

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
  [NodeTypes.Production]: (node) =>
    node.complex ? ComplexDiagram(node.definition) : Diagram(node.definition),
  [NodeTypes.ExceptNonTerminal]: (node) =>
    NonTerminal(`${node.include} - ${node.exceptNonTerminal}`, {}),
  [NodeTypes.ExceptTerminal]: (node) =>
    NonTerminal(`${node.include} - ${node.exceptTerminal}`, {}),
  [NodeTypes.Terminal]: (node) => Terminal(node.terminal),
  [NodeTypes.NonTerminal]: (node) =>
    NonTerminal(node.nonTerminal, {
      href: `#${dasherize(node.nonTerminal)}`,
    }),
  [NodeTypes.Special]: (node) => {
    const sequence = NonTerminal(" " + node.specialSequence + " ", {});
    sequence.attrs.class = "special-sequence";
    return sequence;
  },
  [NodeTypes.Choice]: (node) => Choice(0, ...node.choice),
  [NodeTypes.Sequence]: (node) => Sequence(...node.sequence),
  [NodeTypes.Comment]: (node) => CommentWithLine(node.comment, {}),
  [NodeTypes.Group]: (node, production) => {
    if (node.comment) {
      const commentOnOptional = production.group && production.group.optional;
      if (commentOnOptional) {
        return Choice(
          0,
          CommentWithLine(node.comment, {}),
          node.group.items[1]
        );
      }
      return node.group
        ? Sequence(node.group, CommentWithLine(node.comment, {}))
        : CommentWithLine(node.comment, {});
    }

    return node.group;
  },
  [NodeTypes.Optional]: (node) => Choice(1, Skip(), node.optional),
  [ExtraNodeTypes.Skip]: () => Skip(),
  [NodeTypes.Repetition]: (node) => {
    if (node.skippable === true) {
      return Choice(1, Skip(), OneOrMore(node.repetition));
    }
    if (node.skippable === false) {
      return node.repeater
        ? OneOrMore(node.repetition, node.repeater)
        : OneOrMore(node.repetition);
    }
    if (node.amount !== undefined) {
      return OneOrMore(node.repetition, Comment(`${node.amount} ×`, {}));
    }
  },
};

const maxChoiceLength = (max) => ({
  [NodeTypes.Choice]: (node) => {
    const makeChoice = (items) => new Choice(0, items);
    const choiceOptions = node.items;
    const choiceLists = [];
    while (choiceOptions.length > max) {
      const subList = choiceOptions.splice(0, max);
      choiceLists.push(makeChoice(subList));
    }
    choiceLists.push(makeChoice(choiceOptions));
    return choiceLists.length > 1
      ? HorizontalChoice(...choiceLists)
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
      if (subSequences.length === 1) {
        return Sequence(...subSequences[0]);
      }
      return Stack(
        ...subSequences.map((subSequence) => Sequence(...subSequence))
      );
    }
    return node;
  },
};

const MAX_CHOICE_LENGTH = 10;

const identity = (x) => x;
const dot = (f) => (g) => (x) => f(g(x));

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
          [NodeTypes.NonTerminal]: (node) => {
            const expand =
              !expanded.includes(node.text) &&
              metadata[node.text] &&
              !metadata[node.text].characterSet;

            const nested = ast.find((item) => item.identifier === node.text);
            if (!expand || !nested) {
              return node;
            }
            expanded.push(node.text);

            return Group(
              renderDiagram(nested.definition),
              Comment(node.text, { href: `#${dasherize(node.text)}` })
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

  return diagram
    .toString()
    .replace(/height="(\d+)"/, `style="max-height: $1px;"`);
};

module.exports = {
  createDiagram,
};
