const program = require("commander");
const util = require("util");
const readFile = util.promisify(require("fs").readFile);
const writeFile = util.promisify(require("fs").writeFile);
const { parseEbnf } = require("./main");
const {
  createDocumentation: createHtmlDocumentation,
} = require("./html-report-builder");
const {
  createDocumentation: createMarkdownDocumentation,
} = require("./markdown-report-builder");
const { validateEbnf } = require("./validate");
const { version } = require("../package.json");
const { productionToEBNF } = require("./ebnf-builder");
const { optimizeText: optimize } = require("./structure-optimizer");

program
  .version(version)

  .usage("[options] <file>")
  .option("-q, --quiet", "suppress output to STDOUT")

  .description(
    "Converts an ISO/IEC 14977 EBNF file to a HTML/Markdown file with SVG railroad diagrams"
  )
  .option("-o, --target [target]", "output the file to target destination.")
  .option("--no-target", "skip writing output HTML", null)
  .option("-t, --title [title]", "title to use for HTML document")
  .option("--lint", "exit with status code 2 if EBNF document has warnings")
  .option("--write-style", "rewrites the source document with styled text")
  .option(
    "--rewrite",
    "rewrites the source document with styled and optimized text"
  )
  .option(
    "--no-optimizations",
    "does not try to optimize the diagrams and texts"
  )
  .option(
    "--no-overview-diagram",
    "skip creating overview diagrams for root elements"
  )
  .option("--no-diagram-wrap", "does not wrap diagrams for width minimization")
  .option(
    "--no-text-formatting",
    "does not format the output text version (becomes single line)"
  )
  .option("--dump-ast", "dump EBNF file AST for further processing")
  .option("--read-ast", "input file is in the AST format");

async function run(args) {
  program.parse(args);
  if (program.args.length === 0) {
    program.outputHelp();
    return;
  }
  const allowOutput = !program.quiet;
  const optimizeDiagrams = program.optimizations;
  const overviewDiagram = program.overviewDiagram;
  const optimizeText = program.optimizations;
  const textFormatting = program.textFormatting;
  const diagramWrap = program.diagramWrap;
  const output = (text) => allowOutput && process.stdout.write(text + "\n");
  const outputError = (text) =>
    allowOutput && process.stderr.write(text + "\n");
  const errLocation = (struct) =>
    struct.pos !== undefined
      ? `${struct.line}:${struct.pos}`
      : `${struct.line}`;
  const outputErrorStruct = (struct) =>
    allowOutput &&
    process.stderr.write(
      `${struct.type} on line ${errLocation(struct)}: ${struct.message}\n`
    );

  try {
    const filename = program.args[0];
    const ebnf = await readFile(filename, "utf8");

    const basename = filename.split(".").slice(0, -1).join(".");
    const defaultOutputFilename = basename + ".html";
    const documentTitle = program.title || basename;

    const targetFilename =
      program.target === true ? defaultOutputFilename : program.target;

    const ast = !program.readAst ? parseEbnf(ebnf) : JSON.parse(ebnf);
    const warnings = validateEbnf(ast);

    if (program.dumpAst) {
      const defaultDumpFilename = basename + ".json";
      const dumpFilename =
        program.target === true ? defaultDumpFilename : program.target;
      await writeFile(dumpFilename, JSON.stringify(ast), "utf8");
      output(`🧬 AST dumped at ${dumpFilename}`);
      return;
    }
    warnings.length > 0 &&
      allowOutput &&
      warnings.forEach((warning) => outputErrorStruct(warning));

    if (program.writeStyle || program.rewrite) {
      const optimizedAST = program.rewrite ? optimize(ast) : ast;

      const prettyOutput = productionToEBNF(optimizedAST, {
        markup: false,
        format: true,
      });
      await writeFile(filename, prettyOutput, "utf8");
      output(`💅 Source updated at ${filename}`);
    }
    const markdown = targetFilename.endsWith(".md");
    if (targetFilename && !markdown) {
      const report = createHtmlDocumentation(ast, {
        title: documentTitle,
        optimizeDiagrams,
        optimizeText,
        textFormatting,
        overviewDiagram,
        diagramWrap,
      });
      await writeFile(targetFilename, report, "utf8");
      output(`📜 Document created at ${targetFilename}`);
    }
    if (targetFilename && markdown) {
      const report = createMarkdownDocumentation(ast, {
        title: documentTitle,
        optimizeDiagrams,
        optimizeText,
        textFormatting,
        overviewDiagram,
        diagramWrap,
      });
      await writeFile(targetFilename, report, "utf8");
      output(`📜 Document created at ${targetFilename}`);
    }
    warnings.length > 0 && program.validate && process.exit(2);
  } catch (e) {
    if (e.data) {
      const { line, expected, token, pos } = e.data;
      outputErrorStruct({
        line,
        pos,
        type: "Parse error",
        message: `Expected ${expected}, got ${token}`,
      });
    } else {
      console.log(e);
      outputError(e.message);
      output("");
      output("use --help for usage information");
    }
    process.exit(1);
  }
}
module.exports = {
  run,
};
