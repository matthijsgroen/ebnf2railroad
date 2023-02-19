const { searchReferencesFromIdentifier } = require("./references");
const { optimizeText } = require("./structure-optimizer");
const { productionToEBNF } = require("./ebnf-builder");
const { createStructuralToc, createDefinitionMetadata } = require("./toc");
const { draw } = require("utf-railroad");
const { createDiagram } = require("./build-ascii-diagram");
const prettier = require("prettier");

const dedent = (text) => {
  const lines = text.split("\n");
  const minimalIndentation = lines.reduce((acc, line) => {
    const match = line.match(/^(\s+)\S/);
    return match && match[1].length < acc ? match[1].length : acc;
  }, Infinity);
  return lines.map((line) => line.slice(minimalIndentation)).join("\n");
};

const codeBlock = (text, language = "") =>
  "\n```" + language + "\n" + text + "\n```\n\n";

const createDocumentation = (ast, options) => {
  const structuralToc = createStructuralToc(ast);
  const metadata = createDefinitionMetadata(structuralToc);

  const contents = ast
    .map((production) => {
      if (production.comment) {
        return dedent(production.comment);
      }
      const outgoingReferences = searchReferencesFromIdentifier(
        production.identifier,
        ast
      );
      const textDeclaraion = productionToEBNF(
        options.optimizeText ? optimizeText(production) : production,
        {
          format: options.textFormatting,
        }
      );
      const diagram = draw(
        createDiagram(production, metadata, ast, {
          ...options,
          overview:
            metadata[production.identifier].root && options.overviewDiagram,
          complex: outgoingReferences.length > 0,
        })
      )
        .split("\n")
        .map((line) => line.trimRight())
        .join("\n");

      return `## ${production.identifier}\n\n${codeBlock(
        diagram
      )}\nText:\n${codeBlock(textDeclaraion, "ebnf")}`;
    })
    .join("\n");

  return prettier.format(contents, { parser: "markdown", proseWrap: "always" });
};

module.exports = {
  createDocumentation,
};
