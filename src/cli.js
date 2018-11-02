const program = require("commander");
const util = require("util");
const readFile = util.promisify(require("fs").readFile);
const writeFile = util.promisify(require("fs").writeFile);
const { parser } = require("./ebnf-parser");
const { createDocumentation, valididateEbnf } = require("./report-builder");

program.version("1.0.0");

program
  .usage("[options] <file>")
  .option("-o, --target [target]", "output the file to target destination.")
  .option("-q, --quiet", "suppress output to STDOUT")
  .option("--validate", "exit with status code 2 if ebnf document has warnings")
  .option("--title [title]", "title to use for HTML document")
  .description(
    "Converts an ISO/IEC 14977 EBNF file to a HTML file with SVG railroad diagrams"
  );

async function run(args) {
  program.parse(args);
  if (program.args.length === 0) {
    program.outputHelp();
    return;
  }
  const allowOutput = !program.quiet;
  const output = text => allowOutput && process.stdout.write(text + "\n");

  try {
    const filename = program.args[0];
    const ebnf = await readFile(filename, "utf8");
    const basename = filename
      .split(".")
      .slice(0, -1)
      .join(".");
    const defaultOutputFilename = basename + ".html";
    const documentTitle = program.title || basename;

    const targetFilename = program.target || defaultOutputFilename;

    const ast = parser.parse(ebnf);
    const warnings = valididateEbnf(ast);

    warnings.length > 0 && allowOutput && warnings.forEach(output);

    const report = createDocumentation(ast, {
      title: documentTitle
    });
    await writeFile(targetFilename, report, "utf8");

    output(`📜 Document created at ${targetFilename}`);
    warnings.length > 0 && program.validate && process.exit(2);
  } catch (e) {
    output(e.message);
    process.exit(1);
  }
}

module.exports = {
  run
};
