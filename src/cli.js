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
    return `Choice(${diagram.items
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

async function run(args) {
  program.parse(args);
  if (program.args.length === 0) {
    program.outputHelp();
    return;
  }
  const filename = program.args[0];
  const ebnf = await readFile(filename, "utf8");
  const ast = ebnfParser.parse(ebnf);
  //const seqA = Sequence("a", "b");
  //const seqB = Sequence("c", "d");
  //if (seqA instanceof Sequence) {
  //console.log("sequence!");
  //seqA.items.push(...seqB.items);
  //}
  //console.log(seqA);
  //console.log(prettyPrintDiagram(ast[2].diagram));
  ast.forEach(production => {
    console.log("-- Rule: ", production.identifier);
    console.log(prettyPrintDiagram(production.diagram));
  });
}

module.exports = {
  run
};
