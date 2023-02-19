const dasherize = (str) => str.replace(/\s+/g, "-");
const sanitize = (str, markup) =>
  markup
    ? str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    : str;

const lineIndent = (indent) => "\n" + "  ".repeat(indent);

const wrapTag = (tag, attributes, content, markup) =>
  markup
    ? `<${tag} ${Object.entries(attributes)
        .map(([name, value]) => `${name}="${value}"`)
        .join(" ")}>${content}</${tag}>`
    : content;

const wrapSpan = (classNames, content, markup) =>
  wrapTag("span", { class: classNames }, content, markup);

const MAX_LINE_LENGTH = 40;
const LINE_MARGIN_LENGTH = 30;

const defaultOptions = {
  markup: false,
  format: false,
  maxLineLength: MAX_LINE_LENGTH,
  lineMargin: LINE_MARGIN_LENGTH,
  indent: 0,
};

const detectRenderConfig = (item, options) => {
  const multiLineChoice =
    item.choice &&
    productionToEBNF(item, { format: false, markup: false }).length >
      options.maxLineLength &&
    item.choice.length <= 6 &&
    options.format;

  if (multiLineChoice) {
    return {
      ...options,
      offsetLength: 0,
      multiline: true,
      indent: 1,
      rowCount: 1,
    };
  }

  const multiLineChoiceWithWrap =
    item.choice && item.choice.length > 6 && options.format;
  if (multiLineChoiceWithWrap) {
    const longestChoice = item.choice
      .map((choice) =>
        productionToEBNF(choice, { format: false, markup: false })
      )
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
      indent: options.indent + 1,
    };
  }

  return options;
};

const calculateMaxLength = (production, format) => {
  const output = productionToEBNF(production, { markup: false, format });
  const multiLine = output.includes("\n");
  return multiLine ? -1 : output.length;
};

const productionToEBNF = (production, setOptions) => {
  const options = {
    ...defaultOptions,
    ...setOptions,
  };

  if (Array.isArray(production)) {
    return production
      .map((item) => productionToEBNF(item, options))
      .join("\n\n");
  }
  if (production.identifier) {
    const renderConfig = detectRenderConfig(production.definition, {
      ...options,
      offsetLength: production.identifier.length + 3,
    });

    return `${wrapSpan(
      "ebnf-identifier",
      production.identifier,
      options.markup
    )}${
      renderConfig.multiline ? lineIndent(renderConfig.indent) : " "
    }= ${productionToEBNF(production.definition, renderConfig)}${
      renderConfig.multiline ? lineIndent(renderConfig.indent) : " "
    }${wrapSpan("ebnf-end", ";", options.markup)}`;
  }
  if (production.terminal) {
    return production.terminal.indexOf('"') > -1
      ? wrapSpan(
          "ebnf-terminal",
          `'${sanitize(production.terminal, options.markup)}'`,
          options.markup
        )
      : wrapSpan(
          "ebnf-terminal",
          `"${sanitize(production.terminal, options.markup)}"`,
          options.markup
        );
  }
  if (production.nonTerminal) {
    return wrapTag(
      "a",
      {
        class: "ebnf-non-terminal",
        href: `#${dasherize(production.nonTerminal)}`,
      },
      production.nonTerminal,
      options.markup
    );
  }
  if (production.choice) {
    if (options.multiline && options.format) {
      return (
        production.choice
          .map((choice, index, choices) => {
            if (!options.padding || !options.rowCount) {
              return productionToEBNF(choice, { ...options, multiline: false });
            }
            const inColumn = index % options.rowCount;
            const longestOfColumn = choices
              .filter((elem, index) => index % options.rowCount === inColumn)
              .map(
                (elem) =>
                  productionToEBNF(elem, { format: false, markup: false })
                    .length
              )
              .reduce((max, elem) => (max > elem ? max : elem));

            const length = productionToEBNF(choice, {
              markup: false,
              format: false,
            }).length;
            const padding = " ".repeat(Math.max(longestOfColumn - length, 0));

            return (
              productionToEBNF(choice, { ...options, multiline: false }) +
              padding
            );
          })
          .map((elem, index) => {
            if (index === 0) return elem;
            const addBreak = index % options.rowCount === 0;

            return `${addBreak ? lineIndent(options.indent) : " "}| ${elem}`;
          })
          .join("")
          // Remove potentially added whitespace paddings at the end of the line
          .split("\n")
          .map((line) => line.trimEnd())
          .join("\n")
      );
    }
    return production.choice
      .map((choice) => productionToEBNF(choice, options))
      .join(" | ");
  }
  if (production.sequence) {
    const sequenceLength = (list, offset, till = undefined) =>
      list
        .slice(0, till)
        .reduce(
          (acc, elem) => (elem.length === -1 ? 0 : acc + elem.length + 3),
          offset
        );

    return (
      production.sequence
        .map((element) => ({
          element,
          length: calculateMaxLength(element, options.format),
        }))
        .map(({ element }, index, list) => {
          if (index === 0) return productionToEBNF(element, options);
          const indent = options.indent + 1;

          const currentLength = sequenceLength(
            list,
            options.offsetLength || 0,
            index
          );

          const nextLength = sequenceLength(
            list,
            options.offsetLength || 0,
            index + 1
          );
          const totalLength = sequenceLength(list, options.offsetLength || 0);
          const addBreak =
            options.format &&
            currentLength > options.maxLineLength &&
            nextLength > options.maxLineLength + options.lineMargin / 2 &&
            totalLength - currentLength > 10;
          if (addBreak) list[index - 1].length = -1;

          const offsetLength = addBreak ? 0 : currentLength;
          const output = productionToEBNF(element, {
            ...options,
            offsetLength,
          });
          if (options.format && output.indexOf("\n") !== -1) {
            const lastLineLength = output.split("\n").slice(-1)[0].length;
            list[index].length = lastLineLength - currentLength;
          }

          return ` ,${addBreak ? lineIndent(indent) : " "}${output}`;
        })
        .join("")
        // Remove potentially added whitespace paddings at the end of the line
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n")
    );
  }
  if (production.specialSequence) {
    return wrapSpan(
      "ebnf-special-sequence",
      `? ${production.specialSequence} ?`,
      options.markup
    );
  }
  if (production.repetition && production.amount !== undefined) {
    return `${wrapSpan(
      "ebnf-multiplier",
      `${production.amount} *`,
      options.markup
    )} ${productionToEBNF(production.repetition, options)}`;
  }
  if (production.repetition) {
    const renderConfig = detectRenderConfig(production.repetition, options);
    return `${
      renderConfig.multiline ? lineIndent(renderConfig.indent) : ""
    }{ ${productionToEBNF(production.repetition, renderConfig)}${
      renderConfig.multiline ? lineIndent(renderConfig.indent) : " "
    }}`;
  }
  if (production.comment && !production.group) {
    return `${wrapSpan(
      "ebnf-comment",
      `(*${sanitize(production.comment, options.markup)}*)`,
      options.markup
    )}`;
  }
  if (production.comment) {
    return production.before
      ? `${wrapSpan(
          "ebnf-comment",
          `(*${sanitize(production.comment, options.markup)}*)`,
          options.markup
        )} ${productionToEBNF(production.group, options)}`
      : `${productionToEBNF(production.group, options)} ${wrapSpan(
          "ebnf-comment",
          `(*${sanitize(production.comment, options.markup)}*)`,
          options.markup
        )}`;
  }
  if (production.group) {
    const renderConfig = detectRenderConfig(production.group, options);
    return `${
      renderConfig.multiline ? lineIndent(renderConfig.indent) : ""
    }( ${productionToEBNF(production.group, renderConfig)}${
      renderConfig.multiline ? lineIndent(renderConfig.indent) : " "
    })`;
  }
  if (production.optional) {
    const renderConfig = detectRenderConfig(production.optional, options);
    return `${
      renderConfig.multiline ? lineIndent(renderConfig.indent) : ""
    }[ ${productionToEBNF(production.optional, renderConfig)}${
      renderConfig.multiline ? lineIndent(renderConfig.indent) : " "
    }]`;
  }
  if (production.exceptNonTerminal) {
    return `${productionToEBNF(
      {
        nonTerminal: production.include,
      },
      options
    )} - ${productionToEBNF(
      { nonTerminal: production.exceptNonTerminal },
      options
    )}`;
  }
  if (production.exceptTerminal) {
    return `${productionToEBNF(
      {
        nonTerminal: production.include,
      },
      options
    )} - ${productionToEBNF({ terminal: production.exceptTerminal }, options)}`;
  }
  return "unknown construct";
};

module.exports = {
  productionToEBNF,
};
