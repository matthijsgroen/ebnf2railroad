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
const { createAlphabeticalToc, createStructuralToc } = require("./toc");
const { productionToEBNF } = require("./ebnf-builder");

const dasherize = str => str.replace(/\s+/g, "-");
const SHRINK_CHOICE = 10;

const productionToDiagram = production => {
  if (production.identifier) {
    return production.complex
      ? ComplexDiagram(productionToDiagram(production.definition))
      : Diagram(productionToDiagram(production.definition));
  }
  if (production.terminal) {
    return Terminal(production.terminal);
  }
  if (production.nonTerminal) {
    return NonTerminal(
      production.nonTerminal,
      `#${dasherize(production.nonTerminal)}`
    );
  }
  if (production.skip) {
    return Skip();
  }
  if (production.specialSequence) {
    const sequence = NonTerminal(" " + production.specialSequence + " ");
    sequence.attrs.class = "special-sequence";
    return sequence;
  }
  if (production.choice) {
    const makeChoice = items => new Choice(0, items);
    const options = production.choice.map(productionToDiagram);
    const choiceLists = [];
    while (options.length > SHRINK_CHOICE) {
      const subList = options.splice(0, SHRINK_CHOICE);
      choiceLists.push(makeChoice(subList));
    }
    choiceLists.push(makeChoice(options));
    return choiceLists.length > 1
      ? HorizontalChoice(...choiceLists)
      : choiceLists[0];
  }
  if (production.sequence) {
    return Sequence(...production.sequence.map(productionToDiagram));
  }
  if (production.repetition && production.skippable === true) {
    return Choice(
      1,
      Skip(),
      OneOrMore(productionToDiagram(production.repetition))
    );
  }
  if (production.repetition && production.skippable === false) {
    return production.repeater
      ? OneOrMore(
          productionToDiagram(production.repetition),
          productionToDiagram(production.repeater)
        )
      : OneOrMore(productionToDiagram(production.repetition));
  }
  if (production.repetition && production.amount !== undefined) {
    return OneOrMore(
      productionToDiagram(production.repetition),
      Comment(`${production.amount} ×`)
    );
  }
  if (production.optional) {
    return Choice(1, Skip(), productionToDiagram(production.optional));
  }
  if (production.comment) {
    return production.group
      ? Sequence(
          productionToDiagram(production.group),
          Comment(production.comment)
        )
      : Comment(production.comment);
  }
  if (production.group) {
    return productionToDiagram(production.group);
  }
  if (production.exceptNonTerminal) {
    return NonTerminal(
      `${production.include} - ${production.exceptNonTerminal}`
    );
  }
  if (production.exceptTerminal) {
    return NonTerminal(`${production.include} - ${production.exceptTerminal}`);
  }
  return "unknown construct";
};

const vacuum = htmlContents => htmlContents.replace(/>\s+</g, "><");

const createTocStructure = tocData =>
  tocData
    .map(
      tocNode =>
        `<li><a href="#${dasherize(
          tocNode.name.trim()
        )}">${tocNode.name.trim()} ${tocNode.recursive ? "↖︎" : ""}</a>${
          tocNode.children
            ? `<ul>${createTocStructure(tocNode.children)}</ul>`
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

      const diagram = productionToDiagram({
        ...renderProduction,
        complex: outgoingReferences.length > 0
      });
      return ebnfTemplate({
        identifier: production.identifier,
        ebnf: productionToEBNF(production, { markup: true, format: true }),
        referencedBy: searchReferencesToIdentifier(production.identifier, ast),
        referencesTo: outgoingReferences,
        diagram: vacuum(diagram.toString())
      });
    })
    .join("");

  const alphabeticalToc = createTocStructure(createAlphabeticalToc(ast));
  const hierarchicalToc = createTocStructure(createStructuralToc(ast));

  const htmlContent = documentContent({
    title: options.title,
    contents,
    alphabeticalToc,
    hierarchicalToc
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
