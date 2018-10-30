const program = require("commander");
const util = require("util");
const readFile = util.promisify(require("fs").readFile);
const writeFile = util.promisify(require("fs").writeFile);
const { parser } = require("./ebnf-parser");
const { createDocumentation, optimizeAst } = require("./report-builder");

program.version("1.0.0");

program
  .usage("[options] <file>")
  .option("-o, --target [target]", "output the file to target destination.")
  .description(
    "Converts a EBNF file to a HTML file with SVG railroad diagrams"
  );

async function run(args) {
  program.parse(args);
  if (program.args.length === 0) {
    program.outputHelp();
    return;
  }

  try {
    const filename = program.args[0];
    const ebnf = await readFile(filename, "utf8");
    const basename = filename
      .split(".")
      .slice(0, -1)
      .join(".");
    const defaultOutputFilename = basename + ".html";

    const targetFilename = program.target || defaultOutputFilename;

    const ast = parser.parse(ebnf);
    const optimizedAst = optimizeAst(ast);
    const report = createDocumentation(optimizedAst, {
      title: basename
    });
    await writeFile(targetFilename, report, "utf8");
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

module.exports = {
  run
};
