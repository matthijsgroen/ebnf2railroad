import "./index.css";

const ace = require("brace");
require("brace/mode/plain_text");
require("brace/theme/monokai");
const { parseEbnf, validateEbnf } = require("ebnf2railroad");

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

const validateAst = ast => {
  const result = validateEbnf(ast);
  editor.getSession().clearAnnotations();
  editor.getSession().setAnnotations(
    result.map(warning => ({
      text: `${warning.type}: ${warning.message}`,
      type: "warning",
      column: 0,
      row: warning.line
    }))
  );
};

const updateAst = ast => {};
