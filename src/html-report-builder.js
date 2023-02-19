const { optimizeText } = require("./structure-optimizer");
const {
  documentContent,
  documentFrame,
  documentStyle,
  ebnfTemplate,
  commentTemplate,
} = require("./report-html-template");
const {
  searchReferencesFromIdentifier,
  searchReferencesToIdentifier,
} = require("./references");
const {
  createAlphabeticalToc,
  createStructuralToc,
  createDefinitionMetadata,
} = require("./toc");
const { productionToEBNF } = require("./ebnf-builder");
const { createDiagram } = require("./build-diagram");

const dasherize = (str) => str.replace(/\s+/g, "-");
const vacuum = (htmlContents) => htmlContents.replace(/>\s+</g, "><");

const createTocStructure = (tocData, metadata) =>
  tocData
    .map(
      (tocNode) =>
        `<li${
          (metadata[tocNode.name] || {}).root
            ? ' class="root-node"'
            : (metadata[tocNode.name] || {}).common
            ? ' class="common-node"'
            : ""
        }><a href="#${dasherize(
          tocNode.name.trim()
        )}">${tocNode.name.trim()}</a>
        ${
          (metadata[tocNode.name] || {}).recursive
            ? '<dfn title="recursive">♺</dfn>'
            : ""
        }
        ${
          tocNode.children
            ? `<ul>${createTocStructure(tocNode.children, metadata)}</ul>`
            : ""
        }
      </li>`
    )
    .join("");

const createDocumentation = (ast, options) => {
  const structuralToc = createStructuralToc(ast);
  const metadata = createDefinitionMetadata(structuralToc);

  const contents = ast
    .map((production) => {
      if (production.comment) {
        return commentTemplate(production.comment);
      }

      const outgoingReferences = searchReferencesFromIdentifier(
        production.identifier,
        ast
      );

      const diagram = createDiagram(production, metadata, ast, {
        ...options,
        overview:
          metadata[production.identifier].root && options.overviewDiagram,
        complex: outgoingReferences.length > 0,
      });

      return ebnfTemplate({
        identifier: production.identifier,
        ebnf: productionToEBNF(
          options.optimizeText ? optimizeText(production) : production,
          {
            markup: true,
            format: options.textFormatting,
          }
        ),
        referencedBy: searchReferencesToIdentifier(production.identifier, ast),
        referencesTo: outgoingReferences,
        diagram: vacuum(diagram),
      });
    })
    .join("");

  const alphabetical = createAlphabeticalToc(ast);
  const isRoot = (item) => (metadata[item.name] || {}).root;
  const isCommon = (item) => (metadata[item.name] || {}).common;
  const isCharacterSet = (item) => (metadata[item.name] || {}).characterSet;
  const rootItems = alphabetical.filter(
    (item) => isRoot(item) && !isCharacterSet(item)
  );
  const characterSetItems = alphabetical.filter((item) => isCharacterSet(item));
  const commonItems = alphabetical.filter(
    (item) => !isRoot(item) && !isCharacterSet(item) && isCommon(item)
  );
  const otherItems = alphabetical.filter(
    (item) => !isRoot(item) && !isCommon(item) && !isCharacterSet(item)
  );
  const hierarchicalToc = createTocStructure(structuralToc, metadata);

  const htmlContent = documentContent({
    title: options.title,
    contents,
    singleRoot: rootItems.length === 1,
    toc: {
      hierarchical: hierarchicalToc,
      common: createTocStructure(commonItems, metadata),
      roots: createTocStructure(rootItems, metadata),
      characterSets: createTocStructure(characterSetItems, metadata),
      other: createTocStructure(otherItems, metadata),
    },
  });
  return options.full !== false
    ? documentFrame({
        body: htmlContent,
        head: `<style type="text/css">${documentStyle()}</style>`,
        title: options.title,
      })
    : htmlContent;
};

module.exports = {
  createDocumentation,
  documentStyle,
};
