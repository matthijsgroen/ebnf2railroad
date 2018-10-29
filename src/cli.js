const program = require("commander");
const util = require("util");
const readFile = util.promisify(require("fs").readFile);
const ebnfParser = require("./ebnf-parser").parser;
const {
  Diagram,
  Sequence,
  Choice,
  // OneOrMore
  Terminal,
  NonTerminal
  // Skip
} = require("railroad-diagrams");

program.version("1.0.0");

program
  .usage("[options] <file>")
  .description(
    "Converts a EBNF file to a HTML file with SVG railroad diagrams"
  );

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
    return production.nonTerminal;
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

async function run(args) {
  program.parse(args);
  if (program.args.length === 0) {
    program.outputHelp();
    return;
  }
  const filename = program.args[0];
  const ebnf = await readFile(filename, "utf8");
  const basename = filename
    .split(".")
    .slice(0, -1)
    .join(".");
  const defaultOutputFilename = basename + ".html";
  const ast = ebnfParser.parse(ebnf);
  ast.forEach(production => {
    console.log("-- Rule: ", production.identifier);
    console.log("  ", productionToEBNF(production));
    const diagram = productionToDiagram(production);
    console.log("  ", prettyPrintDiagram(diagram));
  });
}

module.exports = {
  run
};
