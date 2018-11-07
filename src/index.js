import "./try-yourself.css";

const ace = require("brace");
const EditSession = ace.EditSession;
require("brace/mode/plain_text");
require("brace/theme/monokai");
const {
  parseEbnf,
  validateEbnf,
  createDocumentation,
  documentStyle
} = require("ebnf2railroad");

const CONTENT_KEY = "ebnf2railroad-content";

const editor = ace.edit("editor");

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

const updateDocument = content => {
  try {
    window.localStorage.setItem(CONTENT_KEY, content);
  } catch (e) {}

  try {
    const ast = parseEbnf(content);
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
    } else {
      console.error(e);
    }
  }
};

const content = window.localStorage.getItem(CONTENT_KEY) || "";
const session = new EditSession(content);

const styleElem = document.createElement("style");
styleElem.setAttribute("type", "text/css");
styleElem.innerHTML = documentStyle();
const headSection = document.getElementsByTagName("head")[0];
headSection.appendChild(styleElem);

editor.setSession(session);
editor.getSession().setMode("ace/mode/plain_text");
editor.setTheme("ace/theme/monokai");
editor.session.setTabSize(2);
editor.session.setUseSoftTabs(true);
editor.setHighlightActiveLine(true);
editor.getSession().setUseWrapMode(true);
updateDocument(content);

editor.getSession().on("change", () => {
  const newValue = editor.getValue();
  updateDocument(newValue);
});
