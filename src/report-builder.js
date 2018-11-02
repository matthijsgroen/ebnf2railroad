const {
  Choice,
  Comment,
  ComplexDiagram,
  Diagram,
  HorizontalChoice,
  NonTerminal,
  OneOrMore,
  OptionalSequence,
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

const productionToEBNF = production => {
  if (production.identifier) {
    return `${production.identifier} = ${productionToEBNF(
      production.definition
    )};`;
  }
  if (production.terminal) {
    return production.terminal.indexOf('"') > -1
      ? `'${production.terminal}'`
      : `"${production.terminal}"`;
  }
  if (production.nonTerminal) {
    return `<a href="#${production.nonTerminal}">${production.nonTerminal}</a>`;
  }
  if (production.choice) {
    return production.choice.map(productionToEBNF).join(" | ");
  }
  if (production.sequence) {
    return production.sequence.map(productionToEBNF).join(" , ");
  }
  if (production.specialSequence) {
    return `? ${production.specialSequence} ?`;
  }
  if (production.repetition && production.amount !== undefined) {
    return `${production.amount} * ${productionToEBNF(production.repetition)}`;
  }
  if (production.repetition) {
    return `{ ${productionToEBNF(production.repetition)} }`;
  }
  if (production.comment) {
    return `${productionToEBNF(production.group)} (* ${production.comment} *)`;
  }
  if (production.group) {
    return `( ${productionToEBNF(production.group)} )`;
  }
  if (production.optional) {
    return `[ ${productionToEBNF(production.optional)} ]`;
  }
  if (production.exceptNonTerminal) {
    return `${productionToEBNF({
      nonTerminal: production.include
    })} - ${productionToEBNF({ nonTerminal: production.exceptNonTerminal })}`;
  }
  if (production.exceptTerminal) {
    return `${productionToEBNF({
      nonTerminal: production.include
    })} - ${production.exceptTerminal}`;
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
    return NonTerminal(production.nonTerminal, `#${production.nonTerminal}`);
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

const getReferences = production => {
  if (production.definition) {
    return getReferences(production.definition);
  }
  if (production.terminal) {
    return [];
  }
  if (production.nonTerminal) {
    return [production.nonTerminal];
  }
  if (production.choice) {
    return production.choice
      .map(item => getReferences(item))
      .reduce((acc, item) => acc.concat(item), [])
      .filter(Boolean);
  }
  if (production.sequence) {
    return production.sequence
      .map(item => getReferences(item))
      .reduce((acc, item) => acc.concat(item), [])
      .filter(Boolean);
  }
  if (production.repetition) {
    return getReferences(production.repetition);
  }
  if (production.optional) {
    return getReferences(production.optional);
  }
  if (production.group) {
    return getReferences(production.group);
  }
  if (production.exceptNonTerminal) {
    return [production.exceptNonTerminal, production.include];
  }
  if (production.exceptTerminal) {
    return [production.include];
  }
  return [];
};

const vacuum = htmlContents => htmlContents.replace(/>\s+</g, "><");

const searchReferencesToIdentifier = (identifier, ast) =>
  ast
    .filter(production => production.identifier !== identifier)
    .filter(production =>
      getReferences(production).some(ref => ref === identifier)
    )
    .map(production => production.identifier);

const searchReferencesFromIdentifier = (identifier, ast) =>
  ast
    .filter(production => production.identifier === identifier)
    .map(production => getReferences(production))
    .reduce((acc, item) => acc.concat(item), [])
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index);

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

  return documentTemplate({
    title: options.title,
    contents
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
