const program = require("commander");
const util = require("util");
const readFile = util.promisify(require("fs").readFile);
const writeFile = util.promisify(require("fs").writeFile);
const { parser } = require("./ebnf-parser");
const { createDocumentation } = require("./report-builder");

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
  const basename = filename
    .split(".")
    .slice(0, -1)
    .join(".");
  const defaultOutputFilename = basename + ".html";

  const ast = parser.parse(ebnf);
  const report = createDocumentation(ast, {
    title: basename
  });
  await writeFile(defaultOutputFilename, report, "utf8");
}

module.exports = {
  run
};
