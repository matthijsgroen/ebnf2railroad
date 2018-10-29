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
} = require("./report-template");

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

const SHRINK_LIMIT = 13; // This can cut off letters of the alphabet nicely

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
    const results = [];
    while (options.length > SHRINK_LIMIT) {
      const subSection = options.splice(0, SHRINK_LIMIT);
      results.push(Choice(0, ...subSection));
    }
    return results.length === 0
      ? Choice(0, ...options)
      : OptionalSequence(...results, Choice(0, ...options));
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

const hasReferenceTo = (production, identifier) => {
  if (production.definition) {
    return hasReferenceTo(production.definition, identifier);
  }
  if (production.terminal) {
    return false;
  }
  if (production.nonTerminal) {
    return production.nonTerminal === identifier;
  }
  if (production.choice) {
    return production.choice.some(item => hasReferenceTo(item, identifier));
  }
  if (production.sequence) {
    return production.sequence.some(item => hasReferenceTo(item, identifier));
  }
  if (production.repetition) {
    return hasReferenceTo(production.repetition, identifier);
  }
  if (production.optional) {
    return hasReferenceTo(production.optional, identifier);
  }
  if (production.group) {
    return hasReferenceTo(production.group, identifier);
  }
  if (production.exceptNonTerminal) {
    return (
      production.exceptNonTerminal === identifier ||
      production.include === identifier
    );
  }
  if (production.exceptTerminal) {
    return production.include === identifier;
  }
  return false;
};

const searchReferencesToIdentifier = (identifier, ast) =>
  ast
    .filter(production => production.identifier !== identifier)
    .filter(production => hasReferenceTo(production, identifier))
    .map(production => production.identifier);

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
        references: searchReferencesToIdentifier(production.identifier, ast),
        diagram: diagram.toString()
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
