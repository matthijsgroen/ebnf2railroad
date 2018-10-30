const {
  Choice,
  Comment,
  Diagram,
  NonTerminal,
  OneOrMore,
  OptionalSequence,
  Sequence,
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
  if (production.specialSequence) {
    return `? ${production.specialSequence} ?`;
  }
  if (production.repetition && production.skippable === true) {
    return `{ ${productionToEBNF(production.repetition)} }`;
  }
  if (production.repetition && production.skippable === false) {
    return `${productionToEBNF(production.repetition)} , { ${productionToEBNF(
      production.repetition
    )} }`;
  }
  if (production.repetition && production.amount !== undefined) {
    return `${production.amount} * ${productionToEBNF(production.repetition)}`;
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
    return NonTerminal(production.nonTerminal, `#${production.nonTerminal}`);
  }
  if (production.specialSequence) {
    const sequence = Terminal(" " + production.specialSequence + " ");
    sequence.attrs.class = "special-sequence";
    return sequence;
  }
  if (production.choice) {
    const options = production.choice.map(productionToDiagram);
    return Choice(0, ...options);
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
    return OneOrMore(productionToDiagram(production.repetition));
  }
  if (production.repetition && production.amount !== undefined) {
    return OneOrMore(
      productionToDiagram(production.repetition),
      Comment(`${production.amount} ×`)
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

const optimizeProduction = production => {
  if (production.definition) {
    return {
      ...production,
      definition: optimizeProduction(production.definition)
    };
  }
  if (production.choice) {
    return {
      ...production,
      choice: production.choice.map(optimizeProduction)
    };
  }
  if (production.sequence) {
    const optimizedSequence = {
      ...production,
      sequence: production.sequence
        .map((item, idx, list) => {
          const ahead = list[idx + 1];
          if (ahead && ahead.repetition && ahead.skippable === true) {
            const isSame =
              JSON.stringify(ahead.repetition) === JSON.stringify(item);
            if (isSame) {
              ahead.skippable = false;
              return false;
            }
          }
          return optimizeProduction(item);
        })
        .filter(Boolean)
    };
    return optimizedSequence;
  }
  if (production.repetition) {
    return {
      ...production,
      repetition: optimizeProduction(production.repetition)
    };
  }
  if (production.optional) {
    return {
      ...production,
      optional: optimizeProduction(production.optional)
    };
  }
  if (production.group) {
    return {
      ...production,
      group: optimizeProduction(production.group)
    };
  }
  return production;
};

const optimizeAst = ast => ast.map(line => optimizeProduction(line));

module.exports = {
  createDocumentation,
  optimizeAst
};
