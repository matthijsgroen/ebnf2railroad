const {
  Diagram,
  Sequence,
  Choice,
  // OneOrMore
  Terminal,
  NonTerminal
  // Skip
} = require("railroad-diagrams");

const { documentTemplate, ebnfTemplate } = require("./report-template");

prettyPrintDiagram = diagram => {
  if (diagram instanceof Diagram) {
    return `Diagram(${diagram.items
      .filter(t => t.tagName === "g")
      .map(prettyPrintDiagram)
      .join(", ")})`;
  }
  if (diagram instanceof Sequence) {
    return `Sequence(${diagram.items
      .filter(t => t.tagName === "g")
      .map(prettyPrintDiagram)
      .join(", ")})`;
  }
  if (diagram instanceof Choice) {
    return `Choice(0, ${diagram.items
      .filter(t => t.tagName === "g")
      .map(prettyPrintDiagram)
      .join(", ")})`;
  }
  if (diagram instanceof Terminal) {
    return `Terminal("${diagram.text}")`;
  }
  if (diagram instanceof NonTerminal) {
    return `NonTerminal("${diagram.text}")`;
  }
  return "hallo";
};

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
  return "hello";
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
  return "hello";
};

const createDocumentation = (ast, options) => {
  const contents = ast
    .map(production => {
      return {
        identifier: production.identifier,
        ebnf: productionToEBNF(production),
        diagram: productionToDiagram(production).toString()
      };
    })
    .map(ebnfTemplate)
    .join("");

  return documentTemplate({
    title: options.title,
    contents
  });
};

module.exports = {
  createDocumentation
};
