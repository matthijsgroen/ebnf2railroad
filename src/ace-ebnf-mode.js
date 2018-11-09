const ace = require("brace");

ace.define(
  "ace/mode/ebnf_highlight_rules",
  ["require", "exports", "ace/lib/oop", "ace/mode/text_highlight_rules"],
  function(aceRequire, aceExports) {
    function SyntaxHighlighter() {
      const identifier = "[a-zA-Z][a-zA-Z0-9\\s]*";
      this.$rules = {
        start: [
          {
            token: "comment",
            regex: "\\(\\*",
            next: "outerComment"
          },
          {
            token: "support.function",
            regex: identifier
          },
          {
            token: "constant.language",
            regex: "=",
            next: "definition"
          }
        ],
        definition: [
          {
            token: "constant.language",
            regex: ";",
            next: "start"
          },
          {
            token: "keyword.operator",
            regex: "[,|/!]"
          },
          {
            token: "comment",
            regex: "\\(\\*",
            next: "innerComment"
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
            token: "function",
            regex: identifier
          },
          {
            statename: "qstring",
            token: "string.start",
            regex: "'",
            next: [
              {
                token: "string.end",
                regex: "'",
                next: "definition"
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
                next: "definition"
              },
              {
                defaultToken: "string"
              }
            ]
          }
        ],
        innerComment: [
          {
            token: "comment",
            regex: "\\*\\)",
            next: "definition"
          },
          {
            defaultToken: "comment"
          }
        ],
        outerComment: [
          {
            token: "comment",
            regex: "\\*\\)",
            next: "start"
          },
          // Markdown could be supported here
          {
            defaultToken: "comment"
          }
        ]
      };
      this.normalizeRules();
    }
    const oop = aceRequire("../lib/oop");
    const parent = aceRequire("./text_highlight_rules").TextHighlightRules;
    oop.inherits(SyntaxHighlighter, parent);
    aceExports.EBNFHighlightRules = SyntaxHighlighter;
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
  function(aceRequire, aceExports) {
    const highlighter = aceRequire("./ebnf_highlight_rules").EBNFHighlightRules;

    const Mode = function() {
      // constructor
      this.HighlightRules = highlighter;
    };

    const oop = aceRequire("../lib/oop");
    const parent = aceRequire("./text").Mode;

    oop.inherits(Mode, parent);
    (function() {
      // overrides after inheritance
      this.$id = "ace/mode/ebnf";
      this.blockComment = {
        start: "(*",
        end: "*)"
      };
    }.call(Mode.prototype));

    aceExports.Mode = Mode;
  }
);
