import "./try-yourself.css";
import defaultDocument from "./default-document.txt";

const {
  parseEbnf,
  validateEbnf,
  createDocumentation,
  documentStyle,
  version,
  searchReferencesFromIdentifier
} = require("ebnf2railroad");

const styleElem = document.createElement("style");
styleElem.setAttribute("type", "text/css");
styleElem.innerHTML = documentStyle();
const headSection = document.getElementsByTagName("head")[0];
headSection.appendChild(styleElem);

const ace = require("brace");
require("brace/ext/language_tools");
require("./ace-ebnf-mode");

const EditSession = ace.EditSession;
require("brace/theme/iplastic");

// Toggle collapse/expand

const collapseExpand = document.querySelector("a.collapse");
collapseExpand.addEventListener("click", event => {
  event.preventDefault();
  if (document.body.classList.contains("collapsed")) {
    document.body.classList.remove("collapsed");
  } else {
    document.body.classList.add("collapsed");
  }
});

let lastValidAst = [];

const updateAst = ast => {
  lastValidAst = ast;
  const contents = createDocumentation(ast, { title: "Demo", full: false });
  const elem = document.getElementById("result");
  elem.innerHTML = contents;
};

const validateAst = (editor, ast) => {
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

const CONTENT_KEY = "ebnf2railroad-content";

const updateDocument = (editor, store = true) => {
  const content = editor.getValue();
  if (store) {
    try {
      window.localStorage.setItem(CONTENT_KEY, content);
    } catch (e) {}
  }

  try {
    const ast = content.trim() === "" ? [] : parseEbnf(content);
    validateAst(editor, ast);
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

const content = window.localStorage.getItem(CONTENT_KEY) || defaultDocument;

const session = new EditSession(content);
session.setUndoManager(new ace.UndoManager());

const editor = ace.edit("editor");
editor.setOptions({
  enableLiveAutocompletion: true,
  enableBasicAutocompletion: false
});

const getCursorInfo = (session, pos) => {
  const text = session.getValue();
  const line = text.split("\n")[pos.row];
  const preLine = line.slice(0, pos.column);
  const preLineText =
    text
      .split("\n")
      .slice(0, pos.row)
      .join("\n") + "\n";
  const preText = preLineText + preLine;
  const identifierNaming = /(^|;)[^=]*$/.test(preText);
  const preTextInclusive = preLineText + line;

  const currentIdentifierMatch = preTextInclusive.match(
    /(?:^|;|\*\))\s*([a-zA-Z0-9\s]+)=[^=]*$/
  );

  return {
    identifierNaming,
    currentIdentifierName: currentIdentifierMatch && currentIdentifierMatch[1]
  };
};

editor.completers = [
  {
    getCompletions: function(editor, session, pos, prefix, callback) {
      const { identifierNaming } = getCursorInfo(session, pos);

      const definitions = lastValidAst
        .filter(production => production.identifier)
        .map(production => production.identifier);

      const definitionSuggestions = definitions.map(identifier => ({
        value: identifier,
        meta: "identifier"
      }));

      const missingReferences = lastValidAst
        .filter(production => production.identifier)
        .map(production =>
          searchReferencesFromIdentifier(production.identifier, lastValidAst)
        )
        .reduce((acc, item) => acc.concat(item), [])
        .filter((item, index, list) => list.indexOf(item) === index)
        .filter(reference => !definitions.includes(reference))
        .map(reference => ({
          value: reference,
          meta: "missing reference"
        }));

      callback(
        null,
        identifierNaming
          ? missingReferences
          : definitionSuggestions.concat(missingReferences)
      );
    }
  }
];
editor.$blockScrolling = Infinity;
editor.setSession(session);
editor.getSession().setMode("ace/mode/ebnf");
editor.setTheme("ace/theme/iplastic");
editor.session.setTabSize(2);
editor.session.setUseSoftTabs(true);
editor.setHighlightActiveLine(true);
editor.getSession().setUseWrapMode(true);
editor.commands.addCommand({
  name: "Create terminal choices",
  bindKey: { win: "Ctrl-Shift-C", mac: "Command-Shift-C" },
  exec: function(editor) {
    const range = editor.getSelectionRange();
    const selection = editor.session.getTextRange(range);
    const choices = selection
      .split("")
      .map(c => `"${c}"`)
      .join(" | ");
    editor.session.replace(range, choices);
  }
});
editor.commands.addCommand({
  name: "Make markdown text bold",
  bindKey: { win: "Ctrl-B", mac: "Command-B" },
  exec: function(editor) {
    const range = editor.getSelectionRange();
    const selection = editor.session.getTextRange(range);
    editor.session.replace(range, `**${selection}**`);
  }
});

updateDocument(editor, false);
let updateTimeout;
const UPDATE_THROTTLE = 200;
editor.getSession().on("change", () => {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => updateDocument(editor), UPDATE_THROTTLE);
});

const dasherize = text => text.replace(/\s+/g, "-");

const result = document.getElementById("result");
const siteHeader = document.getElementById("header");
const versionSpan = document.querySelector("#header h1 span");
versionSpan && (versionSpan.innerText = `- Version ${version}`);

editor.session.selection.on("changeCursor", function() {
  const cursorPosition = editor.selection.getCursor();
  const info = getCursorInfo(editor.getSession(), cursorPosition);
  if (info.currentIdentifierName) {
    const query = `h4[id=${dasherize(info.currentIdentifierName.trim())}]`;
    const header = document.querySelector(query);
    if (header && result)
      result.scrollTop = header.offsetTop - siteHeader.clientHeight;
  }
});
