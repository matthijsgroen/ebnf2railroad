const {
  Choice,
  Comment,
  ComplexDiagram,
  Diagram,
  HorizontalChoice,
  NonTerminal,
  OneOrMore,
  Sequence,
  Skip,
  Stack,
  Terminal
} = require("railroad-diagrams");

const { optimizeProduction } = require("./structure-optimizer");
const {
  documentContent,
  documentFrame,
  documentStyle,
  ebnfTemplate,
  commentTemplate
} = require("./report-html-template");
const {
  getReferences,
  searchReferencesFromIdentifier,
  searchReferencesToIdentifier
} = require("./references");
const {
  createAlphabeticalToc,
  createStructuralToc,
  createDefinitionMetadata
} = require("./toc");
const { productionToEBNF } = require("./ebnf-builder");

const dasherize = str => str.replace(/\s+/g, "-");

const EXTRA_DIAGRAM_PADDING = 1;
const determineDiagramSequenceLength = production => {
  if (production.sequence) {
    return production.sequence.reduce(
      (total, elem) =>
        determineDiagramSequenceLength(elem) + EXTRA_DIAGRAM_PADDING + total,
      0
    );
  }
  if (production.nonTerminal) {
    return production.nonTerminal.length + EXTRA_DIAGRAM_PADDING;
  }
  if (production.terminal) {
    return production.terminal.length + EXTRA_DIAGRAM_PADDING;
  }
  if (production.group) {
    return determineDiagramSequenceLength(production.group);
  }
  if (production.choice) {
    return (
      production.choice
        .map(elem => determineDiagramSequenceLength(elem))
        .reduce((max, elem) => (max > elem ? max : elem), 0) +
      EXTRA_DIAGRAM_PADDING * 2
    );
  }
  if (production.repetition) {
    const repetitionLength = determineDiagramSequenceLength(
      production.repetition
    );
    const repeaterLength = production.repeater
      ? determineDiagramSequenceLength(production.repeater)
      : 0;
    return (
      Math.max(repetitionLength, repeaterLength) +
      EXTRA_DIAGRAM_PADDING * 2 +
      (production.skippable ? EXTRA_DIAGRAM_PADDING * 2 : 0)
    );
  }
  if (production.optional) {
    return (
      determineDiagramSequenceLength(production.optional) +
      EXTRA_DIAGRAM_PADDING * 2
    );
  }
  return 0;
};

const MAX_CHOICE_LENGTH = 10;

const productionToDiagram = (production, options) => {
  if (production.identifier) {
    return production.complex
      ? ComplexDiagram(productionToDiagram(production.definition, options))
      : Diagram(productionToDiagram(production.definition, options));
  }
  if (production.terminal) {
    return Terminal(production.terminal);
  }
  if (production.nonTerminal) {
    return NonTerminal(production.nonTerminal, {
      href: `#${dasherize(production.nonTerminal)}`
    });
  }
  if (production.skip) {
    return Skip();
  }
  if (production.specialSequence) {
    const sequence = NonTerminal(" " + production.specialSequence + " ", {});
    sequence.attrs.class = "special-sequence";
    return sequence;
  }
  if (production.choice) {
    const makeChoice = items => new Choice(0, items);
    const choiceOptions = production.choice.map(elem =>
      productionToDiagram(elem, options)
    );
    const choiceLists = [];
    while (choiceOptions.length > options.maxChoiceLength) {
      const subList = choiceOptions.splice(0, options.maxChoiceLength);
      choiceLists.push(makeChoice(subList));
    }
    choiceLists.push(makeChoice(choiceOptions));
    return choiceLists.length > 1
      ? HorizontalChoice(...choiceLists)
      : choiceLists[0];
  }
  if (production.sequence) {
    const sequenceLength = determineDiagramSequenceLength(production);
    if (sequenceLength > 45 && options.optimizeSequenceLength) {
      const subSequences = production.sequence
        .reduce(
          (totals, elem, index, list) => {
            const lastList = totals.slice(-1)[0];
            lastList.push(elem);
            const currentLength = determineDiagramSequenceLength({
              sequence: lastList
            });
            const remainingLength = determineDiagramSequenceLength({
              sequence: list.slice(index + 1)
            });
            if (
              currentLength + remainingLength > 40 &&
              currentLength >= 25 &&
              remainingLength > 10
            ) {
              totals.push([]);
            }
            return totals;
          },
          [[]]
        )
        .filter(array => array.length > 0);
      return Stack(
        ...subSequences.map(subSequence =>
          Sequence(
            ...subSequence.map(elem => productionToDiagram(elem, options))
          )
        )
      );
    }

    return Sequence(
      ...production.sequence.map(elem => productionToDiagram(elem, options))
    );
  }
  if (production.repetition && production.skippable === true) {
    return Choice(
      1,
      Skip(),
      OneOrMore(productionToDiagram(production.repetition, options))
    );
  }
  if (production.repetition && production.skippable === false) {
    return production.repeater
      ? OneOrMore(
          productionToDiagram(production.repetition, options),
          productionToDiagram(production.repeater, options)
        )
      : OneOrMore(productionToDiagram(production.repetition, options));
  }
  if (production.repetition && production.amount !== undefined) {
    return OneOrMore(
      productionToDiagram(production.repetition, options),
      Comment(`${production.amount} ×`, {})
    );
  }
  if (production.optional) {
    return Choice(1, Skip(), productionToDiagram(production.optional, options));
  }
  if (production.comment) {
    return production.group
      ? Sequence(
          productionToDiagram(production.group, options),
          Comment(production.comment, {})
        )
      : Comment(production.comment, {});
  }
  if (production.group) {
    return productionToDiagram(production.group, options);
  }
  if (production.exceptNonTerminal) {
    return NonTerminal(
      `${production.include} - ${production.exceptNonTerminal}`,
      {}
    );
  }
  if (production.exceptTerminal) {
    return NonTerminal(
      `${production.include} - ${production.exceptTerminal}`,
      {}
    );
  }
  return "unknown construct";
};

const vacuum = htmlContents => htmlContents.replace(/>\s+</g, "><");

const createTocStructure = (tocData, metadata) =>
  tocData
    .map(
      tocNode =>
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
  const contents = ast
    .map(production => {
      if (production.comment) {
        return commentTemplate(production.comment);
      }
      const outgoingReferences = searchReferencesFromIdentifier(
        production.identifier,
        ast
      );
      const renderProduction =
        options.optimizeDiagrams === false
          ? production
          : optimizeProduction(production);

      const diagram = productionToDiagram(
        {
          ...renderProduction,
          complex: outgoingReferences.length > 0
        },
        {
          maxChoiceLength: options.optimizeDiagrams
            ? MAX_CHOICE_LENGTH
            : Infinity,
          optimizeSequenceLength: options.optimizeDiagrams
        }
      );
      return ebnfTemplate({
        identifier: production.identifier,
        ebnf: productionToEBNF(production, {
          markup: true,
          format: options.textFormatting
        }),
        referencedBy: searchReferencesToIdentifier(production.identifier, ast),
        referencesTo: outgoingReferences,
        diagram: vacuum(diagram.toString())
      });
    })
    .join("");

  const structuralToc = createStructuralToc(ast);
  const metadata = createDefinitionMetadata(structuralToc);
  const alphabetical = createAlphabeticalToc(ast);
  const isRoot = item => (metadata[item.name] || {}).root;
  const isCommon = item => (metadata[item.name] || {}).common;
  const rootItems = alphabetical.filter(item => isRoot(item));
  const commonItems = alphabetical.filter(
    item => !isRoot(item) && isCommon(item)
  );
  const otherItems = alphabetical.filter(
    item => !isRoot(item) && !isCommon(item)
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
      other: createTocStructure(otherItems, metadata)
    }
  });
  return options.full !== false
    ? documentFrame({
        body: htmlContent,
        head: `<style type="text/css">${documentStyle()}</style>`,
        title: options.title
      })
    : htmlContent;
};

const validateEbnf = ast => {
  const identifiers = ast.map(
    production => production && production.identifier
  );

  const doubleDeclarations = ast
    .map((declaration, index) => {
      // skip comments, but keep index in array intact (filter would break index)
      if (!declaration.identifier) return false;
      const firstDeclaration = identifiers.indexOf(declaration.identifier);
      if (firstDeclaration === index) return false;
      return {
        line: declaration.location,
        type: "Duplicate declaration",
        message: `"${declaration.identifier}" already declared on line ${
          ast[firstDeclaration].location
        }`
      };
    })
    .filter(Boolean);

  const missingReferences = ast
    .filter(declaration => declaration.identifier)
    .map(declaration =>
      getReferences(declaration)
        .filter((item, index, list) => list.indexOf(item) === index)
        .filter(reference => !identifiers.includes(reference))
        .map(missingReference => ({
          line: declaration.location,
          type: "Missing reference",
          message: `"${missingReference}" is not declared`
        }))
    )
    .filter(m => m.length > 0)
    .reduce((acc, elem) => acc.concat(elem), []);
  return doubleDeclarations
    .concat(missingReferences)
    .sort((a, b) => a.line - b.line);
};

module.exports = {
  createDocumentation,
  validateEbnf,
  documentStyle
};
