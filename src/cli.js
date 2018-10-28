const program = require("commander");
const util = require("util");
const readFile = util.promisify(require("fs").readFile);
const ebnfParser = require("./ebnf-parser").parser;

program.version("1.0.0");

program
  .usage("[options] <file>")
  .description(
    "Converts a EBNF file to a HTML file with SVG railroad diagrams"
  );

async function run(args) {
  program.parse(args);
  if (program.args.length === 0) {
    program.outputHelp();
    return;
  }
  const filename = program.args[0];
  const ebnf = await readFile(filename, "utf8");
  const ast = ebnfParser.parse(ebnf);
  console.log(ast);
}

module.exports = {
  run
};
