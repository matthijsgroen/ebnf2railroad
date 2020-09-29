const { ebnfTransform, NodeTypes } = require("./ebnf-transform");

const defaultPrinters = {
  [NodeTypes.Root]: a => a.join("\n"),
  [NodeTypes.Production]: a => `${a.identifier} = ${a.definition} ;`,
  [NodeTypes.Terminal]: a => `"${a.terminal}"`,
  [NodeTypes.NonTerminal]: a => `${a.nonTerminal}`,
  [NodeTypes.Choice]: a => a.choice.join(" | "),
  [NodeTypes.Comment]: a => `(*${a.comment}*)`,
  [NodeTypes.Group]: a =>
    a.comment
      ? a.before
        ? `(*${a.comment}*) ${a.group}`
        : `${a.group} (*${a.comment}*)`
      : `( ${a.group} )`,
  [NodeTypes.Sequence]: a => a.sequence.join(" , "),
  [NodeTypes.Optional]: a => `[ ${a.optional} ]`,
  [NodeTypes.Repetition]: a =>
    a.amount ? `${a.amount} * ${a.repetition}` : `{ ${a.repetition} }`,
  [NodeTypes.Special]: a => `? ${a.specialSequence} ?`,
  [NodeTypes.ExceptTerminal]: a => `${a.include} - "${a.exceptTerminal}"`,
  [NodeTypes.ExceptNonTerminal]: a => `${a.include} - ${a.exceptNonTerminal}`
};

const print = ebnfTransform([defaultPrinters]);

const MAX_LINE_LENGTH = 40;
const LINE_MARGIN_LENGTH = 30;

const DEFAULT_OPTIONS = {
  maxLineLength: MAX_LINE_LENGTH,
  lineMargin: LINE_MARGIN_LENGTH,
  indent: 0
};

const detectRenderConfig = (node, options = DEFAULT_OPTIONS) => {
  const multiLineChoice =
    node.choice &&
    print(node).length > options.maxLineLength &&
    node.choice.length <= 6;

  if (multiLineChoice) {
    return {
      ...options,
      offsetLength: 0,
      multiline: true,
      indent: 1,
      rowCount: 1
    };
  }

  const multiLineChoiceWithWrap = node.choice && node.choice.length > 6;
  if (multiLineChoiceWithWrap) {
    const longestChoice = node.choice
      .map(choice => print(choice))
      .reduce((acc, elem) => (acc.length > elem.length ? acc : elem));
    const padding = longestChoice.length;
    const rowCount =
      Math.floor((options.maxLineLength - options.indent * 2) / (padding + 3)) +
      1;

    return {
      ...options,
      multiline: true,
      offsetLength: 0,
      rowCount,
      padding: true,
      indent: options.indent + 1
    };
  }

  return options;
};

const lineIndent = indent => "\n" + "  ".repeat(indent);

const enrich = dataSet1 => dataSet2 =>
  Object.entries(dataSet1).reduce((merge, [key, func]) => {
    merge[key] = (node, result, parents) => {
      if (typeof dataSet2[key] === "function") {
        const r = dataSet2[key](node, result, parents);
        if (r !== undefined) {
          return r;
        }
      }
      return func(node, result, parents);
    };
    return merge;
  }, {});

const formattedPrinters = enrich(defaultPrinters)({
  [NodeTypes.Production]: (result, node) => {
    const renderConfig = detectRenderConfig(node.definition, {
      ...DEFAULT_OPTIONS,
      offsetLength: node.identifier.length + 3
    });

    return `${node.identifier}${
      renderConfig.multiline ? lineIndent(renderConfig.indent) : " "
    }= ${result.definition}${
      renderConfig.multiline ? lineIndent(renderConfig.indent) : " "
    };`;
  },
  [NodeTypes.Choice]: (result, node) => {
    const renderConfig = detectRenderConfig(node, {
      ...DEFAULT_OPTIONS
    });
    if (renderConfig.multiline) {
      return (
        result.choice
          .map((choice, index) => {
            if (!renderConfig.padding || !renderConfig.rowCount) {
              return choice;
            }
            const inColumn = index % renderConfig.rowCount;
            const longestOfColumn = node.choice
              .filter(
                (elem, index) => index % renderConfig.rowCount === inColumn
              )
              .map(elem => print(elem).length)
              .reduce((max, elem) => (max > elem ? max : elem));

            const length = print(node.choice[index]).length;
            const padding = " ".repeat(Math.max(longestOfColumn - length, 0));

            return choice + padding;
          })
          .map((elem, index) => {
            if (index === 0) return elem;
            const addBreak = index % renderConfig.rowCount === 0;

            return `${
              addBreak ? lineIndent(renderConfig.indent) : " "
            }| ${elem}`;
          })
          .join("")
          // Remove potentially added whitespace paddings at the end of the line
          .split("\n")
          .map(line => line.trimEnd())
          .join("\n")
      );
    }
  }
});

const printFormatted = ebnfTransform([formattedPrinters]);

module.exports = { print, printFormatted };
