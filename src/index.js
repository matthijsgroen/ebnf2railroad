import "./index.css";

const ace = require("brace");
require("brace/mode/plain_text");
require("brace/theme/monokai");
const {
  parseEbnf,
  validateEbnf,
  createDocumentation,
  documentStyle
} = require("ebnf2railroad");

const styleElem = document.createElement("style");
styleElem.setAttribute("type", "text/css");
styleElem.innerHTML = documentStyle();
const headSection = document.getElementsByTagName("head")[0];
headSection.appendChild(styleElem);

const editor = ace.edit("editor");
editor.getSession().setMode("ace/mode/plain_text");
editor.setTheme("ace/theme/monokai");
editor.getSession().on("change", () => {
  const newValue = editor.getValue();
  try {
    const ast = parseEbnf(newValue);
    validateAst(ast);
    updateAst(ast);
  } catch (e) {
    if (e.hash) {
      const { expected, line, token } = e.hash;
      editor.getSession().clearAnnotations();
      editor.getSession().setAnnotations([
        {
          text: `Parse error: Expected ${expected}, got ${token}`,
          type: "error",
          column: 0,
          row: line
        }
      ]);
    }
  }
});

let lastValidAst = [];
const updateAst = ast => {
  lastValidAst = ast;
  const contents = createDocumentation(ast, { title: "Demo", full: false });
  const elem = document.getElementById("result");
  elem.innerHTML = contents;
};

const validateAst = ast => {
  const result = validateEbnf(ast);
  editor.getSession().clearAnnotations();
  editor.getSession().setAnnotations(
    result.map(warning => ({
      text: `${warning.type}: ${warning.message}`,
      type: "warning",
      column: 0,
      row: warning.line - 1
    }))
  );
};
