const {
  Choice,
  Diagram,
  NonTerminal,
  OneOrMore,
  Sequence,
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
    return `"${production.terminal}"`;
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
    return Choice(0, ...production.choice.map(productionToDiagram));
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
