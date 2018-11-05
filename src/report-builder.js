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
  documentTemplate,
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
  createToc
} = require("./toc");

const dasherize = str => str.replace(/\s+/g, "-");
const sanitize = str =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const productionToEBNF = production => {
  if (production.identifier) {
    return `<span class="ebnf-identifier">${
      production.identifier
    }</span> = ${productionToEBNF(
      production.definition
    )}<span class="ebnf-end">;</span>`;
  }
  if (production.terminal) {
    return production.terminal.indexOf('"') > -1
      ? `<span class="ebnf-terminal">'${sanitize(production.terminal)}'</span>`
      : `<span class="ebnf-terminal">"${sanitize(production.terminal)}"</span>`;
  }
  if (production.nonTerminal) {
    return `<a class="ebnf-non-terminal" href="#${dasherize(
      production.nonTerminal
    )}">${production.nonTerminal}</a>`;
  }
  if (production.choice) {
    return production.choice.map(productionToEBNF).join(" <wbr />| ");
  }
  if (production.sequence) {
    return production.sequence.map(productionToEBNF).join(" , ");
  }
  if (production.specialSequence) {
    return `<span class="ebnf-special-sequence">? ${
      production.specialSequence
    } ?</span>`;
  }
  if (production.repetition && production.amount !== undefined) {
    return `<span class="ebnf-multiplier">${
      production.amount
    } *</span> ${productionToEBNF(production.repetition)}`;
  }
  if (production.repetition) {
    return `<wbr />{ ${productionToEBNF(production.repetition)} }`;
  }
  if (production.comment) {
    return `${productionToEBNF(
      production.group
    )} <span class="ebnf-comment">(* ${sanitize(production.comment)} *)</span>`;
  }
  if (production.group) {
    return `<wbr />( ${productionToEBNF(production.group)} )`;
  }
  if (production.optional) {
    return `<wbr />[ ${productionToEBNF(production.optional)} ]`;
  }
  if (production.exceptNonTerminal) {
    return `${productionToEBNF({
      nonTerminal: production.include
    })} - ${productionToEBNF({ nonTerminal: production.exceptNonTerminal })}`;
  }
  if (production.exceptTerminal) {
    return `${productionToEBNF({
      nonTerminal: production.include
    })} - ${productionToEBNF({ terminal: production.exceptTerminal })}`;
  }
  return "unknown construct";
};

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
    .map(tocNode => [
      `<li><a href="#${dasherize(tocNode.name)}">${tocNode.name}</a> ${
        tocNode.recursive ? "↖︎" : ""
      }</li>`,
      tocNode.children && `<ul>${createTocStructure(tocNode.children)}</ul>`
    ])
    .filter(Boolean)
    .reduce((acc, elem) => acc.concat(elem), [])
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
      const diagram = productionToDiagram({
        ...optimizeProduction(production),
        complex: outgoingReferences.length > 0
      });
      return ebnfTemplate({
        identifier: production.identifier,
        ebnf: productionToEBNF(production),
        referencedBy: searchReferencesToIdentifier(production.identifier, ast),
        referencesTo: outgoingReferences,
        diagram: vacuum(diagram.toString())
      });
    })
    .join("");

  const specifiedToc = createTocStructure(createToc(ast));
  const alphabeticalToc = createTocStructure(createAlphabeticalToc(ast));
  const hierarchicalToc = createTocStructure(createStructuralToc(ast));

  return documentTemplate({
    title: options.title,
    contents,
    specifiedToc,
    alphabeticalToc,
    hierarchicalToc
  });
};

const valididateEbnf = ast => {
  const identifiers = ast.map(production => production.identifier);

  const doubleDeclarations = ast
    .map((declaration, index) => {
      // skip comments, but keep index in array intact (filter would break index)
      if (!declaration.identifier) return false;
      const firstDeclaration = identifiers.indexOf(declaration.identifier);
      if (firstDeclaration === index) return false;
      return `${declaration.location}: Duplicate declaration: "${
        declaration.identifier
      }" already declared on line ${ast[firstDeclaration].location}.`;
    })
    .filter(Boolean);

  const missingReferences = ast
    .filter(declaration => declaration.identifier)
    .map(declaration =>
      getReferences(declaration)
        .filter((item, index, list) => list.indexOf(item) === index)
        .filter(reference => !identifiers.includes(reference))
        .map(
          missingReference =>
            `${declaration.location}: Missing reference: "${missingReference}".`
        )
    )
    .filter(m => m.length > 0)
    .reduce((acc, elem) => acc.concat(elem), []);
  return doubleDeclarations.concat(missingReferences).sort();
};

module.exports = {
  createDocumentation,
  valididateEbnf
};
