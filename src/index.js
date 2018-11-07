import "./try-yourself.css";

const ace = require("brace");
require("brace/ext/language_tools");

ace.define(
  "ace/mode/ebnf_highlight_rules",
  ["require", "exports", "ace/lib/oop", "ace/mode/text_highlight_rules"],
  function(getDep, result) {
    function SyntaxHighlighter() {
      const identifier = "[a-z][a-z\\s]*";
      this.$rules = {
        start: [
          {
            token: "comment",
            regex: "\\(\\*",
            next: "comment"
          },
          {
            token: "keyword.operator",
            regex: "[,|/!]"
          },
          {
            token: "constant.language",
            regex: "[=;]"
          },
          {
            token: "paren.lparen",
            regex: "[({[]"
          },
          {
            token: "paren.rparen",
            regex: "[)}\\]]"
          },
          {
            token: ["entity.name.function", "constant.language"],
            regex: `(${identifier})(=)`
          },
          {
            statename: "qstring",
            token: "string.start",
            regex: "'",
            next: [
              {
                token: "string.end",
                regex: "'",
                next: "start"
              },
              {
                defaultToken: "string"
              }
            ]
          },
          {
            statename: "qqstring",
            token: "string.start",
            regex: '"',
            next: [
              {
                token: "string.end",
                regex: '"',
                next: "start"
              },
              {
                defaultToken: "string"
              }
            ]
          }
        ],
        comment: [
          {
            token: "comment",
            regex: "\\*\\)",
            next: "start"
          },
          {
            defaultToken: "comment"
          }
        ]
      };
      this.normalizeRules();
    }
    const oop = getDep("../lib/oop");
    const parent = getDep("./text_highlight_rules").TextHighlightRules;
    oop.inherits(SyntaxHighlighter, parent);
    result.EBNFHighlightRules = SyntaxHighlighter;
  }
);

ace.define(
  "ace/mode/ebnf",
  [
    "require",
    "exports",
    "module",
    "ace/mode/ebnf_highlight_rules",
    "ace/mode/text",
    "ace/lib/oop"
  ],
  function(getDep, result) {
    const highlighter = getDep("./ebnf_highlight_rules").EBNFHighlightRules;

    const Mode = function() {
      // constructor
      this.HighlightRules = highlighter;
    };

    const oop = getDep("../lib/oop");
    const parent = getDep("./text").Mode;

    oop.inherits(Mode, parent);
    (function() {
      // overrides after inheritance
      this.$id = "ace/mode/ebnf";
      this.blockComment = {
        start: "(*",
        end: "*)"
      };
    }.call(Mode.prototype));

    result.Mode = Mode;
  }
);

const EditSession = ace.EditSession;
require("brace/theme/twilight");

const {
  parseEbnf,
  validateEbnf,
  createDocumentation,
  documentStyle
} = require("ebnf2railroad");

const CONTENT_KEY = "ebnf2railroad-content";

const editor = ace.edit("editor");
editor.setOptions({
  enableLiveAutocompletion: true,
  enableBasicAutocompletion: false
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

editor.completers = [
  {
    getCompletions: function(editor, session, pos, prefix, callback) {
      const text = session.getValue();
      const line = text.split("\n")[pos.row];
      const preLine = line.slice(0, pos.column);
      const preText =
        text
          .split("\n")
          .slice(0, pos.row)
          .join("\n") +
        "\n" +
        preLine;
      const identifierNaming = /(^|;)[^=]*$/.test(preText);

      const definitions = lastValidAst
        .filter(production => production.identifier)
        .map(production => ({
          value: production.identifier,
          meta: "identifier"
        }));

      const missingReferences = [];

      callback(null, identifierNaming ? missingReferences : definitions);
    }
  }
];
editor.setSession(session);
editor.getSession().setMode("ace/mode/ebnf");
editor.setTheme("ace/theme/twilight");
editor.session.setTabSize(2);
editor.session.setUseSoftTabs(true);
editor.setHighlightActiveLine(true);
editor.getSession().setUseWrapMode(true);
updateDocument(content);

editor.getSession().on("change", () => {
  const newValue = editor.getValue();
  updateDocument(newValue);
});
