const program = require("commander");
const util = require("util");
const readFile = util.promisify(require("fs").readFile);
const writeFile = util.promisify(require("fs").writeFile);
const { parse } = require("./ebnf-parser");
const { createDocumentation, validateEbnf } = require("./report-builder");
const { version } = require("../package.json");
const { productionToEBNF } = require("./ebnf-builder");

program
  .version(version)

  .usage("[options] <file>")
  .option("-q, --quiet", "suppress output to STDOUT")

  .description(
    "Converts an ISO/IEC 14977 EBNF file to a HTML file with SVG railroad diagrams"
  )
  .option("-o, --target [target]", "output the file to target destination.")
  .option("--no-target", "skip writing output HTML", null)
  .option("-t, --title [title]", "title to use for HTML document")
  .option("--lint", "exit with status code 2 if EBNF document has warnings")
  .option("--write-style", "rewrites the source document with styled text")
  .option("--no-optimizations", "does not try to optimize the diagrams")
  .option(
    "--no-text-formatting",
    "does not format the output text version (becomes single line)"
  );

async function run(args) {
  program.parse(args);
  if (program.args.length === 0) {
    program.outputHelp();
    return;
  }
  const allowOutput = !program.quiet;
  const optimizeDiagrams = program.optimizations;
  const textFormatting = program.textFormatting;
  const output = text => allowOutput && process.stdout.write(text + "\n");
  const outputError = text => allowOutput && process.stderr.write(text + "\n");
  const outputErrorStruct = struct =>
    allowOutput &&
    process.stderr.write(
      `${struct.type} on line ${struct.line}: ${struct.message}\n`
    );

  try {
    const filename = program.args[0];
    const ebnf = await readFile(filename, "utf8");

    const basename = filename
      .split(".")
      .slice(0, -1)
      .join(".");
    const defaultOutputFilename = basename + ".html";
    const documentTitle = program.title || basename;

    const targetFilename =
      program.target === true ? defaultOutputFilename : program.target;

    const ast = parse(ebnf);
    const warnings = validateEbnf(ast);

    warnings.length > 0 &&
      allowOutput &&
      warnings.forEach(warning => outputErrorStruct(warning));

    if (program.writeStyle) {
      const prettyOutput =
        ast
          .map(production =>
            productionToEBNF(production, { markup: false, format: true })
          )
          .join("\n\n") + "\n";

      await writeFile(filename, prettyOutput, "utf8");
      output(`💅 Source updated at ${filename}`);
    }

    if (targetFilename) {
      const report = createDocumentation(ast, {
        title: documentTitle,
        optimizeDiagrams,
        textFormatting
      });
      await writeFile(targetFilename, report, "utf8");

      output(`📜 Document created at ${targetFilename}`);
    }
    warnings.length > 0 && program.validate && process.exit(2);
  } catch (e) {
    if (e.hash) {
      const { line, expected, token } = e.hash;
      outputErrorStruct({
        line,
        type: "Parse error",
        message: `Expected ${expected}, got ${token}`
      });
    } else {
      outputError(e.message);
      output("");
      output("use --help for usage information");
    }
    process.exit(1);
  }
}

module.exports = {
  run
};
