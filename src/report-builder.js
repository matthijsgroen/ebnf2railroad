const {
  Choice,
  Diagram,
  NonTerminal,
  OneOrMore,
  Sequence,
  OptionalSequence,
  Skip,
  Terminal
} = require("railroad-diagrams");

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
  if (production.repetition) {
    return `{ ${productionToEBNF(production.repetition)} }`;
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

const productionToDiagram = production => {
  if (production.identifier) {
    return Diagram(productionToDiagram(production.definition));
  }
  if (production.terminal) {
    return Terminal(production.terminal);
  }
  if (production.nonTerminal) {
    return NonTerminal(production.nonTerminal);
  }
  if (production.choice) {
    const options = production.choice.map(productionToDiagram);
    return Choice(0, ...options);
  }
  if (production.sequence) {
    return Sequence(...production.sequence.map(productionToDiagram));
  }
  if (production.repetition) {
    return Choice(
      1,
      Skip(),
      OneOrMore(productionToDiagram(production.repetition))
    );
  }
  if (production.optional) {
    return Choice(0, Skip(), productionToDiagram(production.optional));
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
      const diagram = productionToDiagram(production);
      return ebnfTemplate({
        identifier: production.identifier,
        ebnf: productionToEBNF(production),
        referencedBy: searchReferencesToIdentifier(production.identifier, ast),
        referencesTo: searchReferencesFromIdentifier(
          production.identifier,
          ast
        ),
        diagram: vacuum(diagram.toString())
      });
    })
    .join("");

  return documentTemplate({
    title: options.title,
    contents
  });
};

module.exports = {
  createDocumentation
};
