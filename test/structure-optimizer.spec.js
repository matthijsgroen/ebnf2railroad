const { expect } = require("chai");
const { parser } = require("../src/ebnf-parser");
const { optimizeAST } = require("../src/structure-optimizer");

describe("AST structure optimizer", () => {
  const compareAst = (text, before, after, textMode = after) => {
    const ast = parser.parse(text);
    expect(ast[0].definition).to.eql(before);
    const optimizedDefinition = optimizeAST(ast);
    expect(optimizedDefinition[0].definition).to.eql(after);
    const optimizedTextDefinition = optimizeAST(ast, { textMode: true });
    expect(optimizedTextDefinition[0].definition).to.eql(textMode);
    expect(ast[0].definition).to.eql(before);
  };

  it("does not mutate the input AST", () => {
    compareAst(
      "foo = a | [ b | c ];",
      {
        choice: [
          { nonTerminal: "a" },
          {
            optional: {
              choice: [{ nonTerminal: "b" }, { nonTerminal: "c" }]
            }
          }
        ]
      },
      {
        choice: [
          { skip: true },
          { nonTerminal: "a" },
          { nonTerminal: "b" },
          { nonTerminal: "c" }
        ]
      },
      {
        optional: {
          choice: [
            { nonTerminal: "a" },
            { nonTerminal: "b" },
            { nonTerminal: "c" }
          ]
        }
      }
    );
  });

  it("changes `a | [ b ]` in ast to choice with skip", () => {
    compareAst(
      "foo = a | [ b ];",
      {
        choice: [{ nonTerminal: "a" }, { optional: { nonTerminal: "b" } }]
      },
      {
        choice: [{ skip: true }, { nonTerminal: "a" }, { nonTerminal: "b" }]
      },
      {
        optional: {
          choice: [{ nonTerminal: "a" }, { nonTerminal: "b" }]
        }
      }
    );
  });

  it("changes `a | [ b | [ c ] ]` in ast to choice with skip without duplicates", () => {
    compareAst(
      "foo = a | [ b | [ c ] ];",
      {
        choice: [
          { nonTerminal: "a" },
          {
            optional: {
              choice: [{ nonTerminal: "b" }, { optional: { nonTerminal: "c" } }]
            }
          }
        ]
      },
      {
        choice: [
          { skip: true },
          { nonTerminal: "a" },
          { nonTerminal: "b" },
          { nonTerminal: "c" }
        ]
      },
      {
        optional: {
          choice: [
            { nonTerminal: "a" },
            { nonTerminal: "b" },
            { nonTerminal: "c" }
          ]
        }
      }
    );
  });

  it("changes `a | b | [ b ]` in ast to choice with skip without duplicates", () => {
    compareAst(
      "foo = a | b | [ b ];",
      {
        choice: [
          { nonTerminal: "a" },
          { nonTerminal: "b" },
          { optional: { nonTerminal: "b" } }
        ]
      },
      {
        choice: [{ skip: true }, { nonTerminal: "a" }, { nonTerminal: "b" }]
      },
      {
        optional: {
          choice: [{ nonTerminal: "a" }, { nonTerminal: "b" }]
        }
      }
    );
  });

  it("changes `a | { b }` in ast to choice with skip, a and b+", () => {
    compareAst(
      "foo = a | { b };",
      {
        choice: [
          { nonTerminal: "a" },
          { repetition: { nonTerminal: "b" }, skippable: true }
        ]
      },
      {
        choice: [
          { skip: true },
          { nonTerminal: "a" },
          { repetition: { nonTerminal: "b" }, skippable: false }
        ]
      },
      {
        choice: [
          { nonTerminal: "a" },
          { repetition: { nonTerminal: "b" }, skippable: true }
        ]
      }
    );
  });

  it("merges multiple choices together (using optional)", () => {
    compareAst(
      "foo = a | [ b | c ];",
      {
        choice: [
          { nonTerminal: "a" },
          {
            optional: {
              choice: [{ nonTerminal: "b" }, { nonTerminal: "c" }]
            }
          }
        ]
      },
      {
        choice: [
          { skip: true },
          { nonTerminal: "a" },
          { nonTerminal: "b" },
          { nonTerminal: "c" }
        ]
      },
      {
        optional: {
          choice: [
            { nonTerminal: "a" },
            { nonTerminal: "b" },
            { nonTerminal: "c" }
          ]
        }
      }
    );
  });

  it("merges multiple choices together (using group)", () => {
    compareAst(
      "foo = a | ( b | c );",
      {
        choice: [
          { nonTerminal: "a" },
          {
            group: {
              choice: [{ nonTerminal: "b" }, { nonTerminal: "c" }]
            }
          }
        ]
      },
      {
        choice: [
          { nonTerminal: "a" },
          { nonTerminal: "b" },
          { nonTerminal: "c" }
        ]
      },
      {
        choice: [
          { nonTerminal: "a" },
          { nonTerminal: "b" },
          { nonTerminal: "c" }
        ]
      }
    );
  });

  it("changes `[ a | b | c ]` into single choice with skip", () => {
    compareAst(
      "foo = [ a | b | c ];",
      {
        optional: {
          choice: [
            { nonTerminal: "a" },
            { nonTerminal: "b" },
            { nonTerminal: "c" }
          ]
        }
      },
      {
        choice: [
          { skip: true },
          { nonTerminal: "a" },
          { nonTerminal: "b" },
          { nonTerminal: "c" }
        ]
      },
      {
        optional: {
          choice: [
            { nonTerminal: "a" },
            { nonTerminal: "b" },
            { nonTerminal: "c" }
          ]
        }
      }
    );
  });

  it("changes `a , { a }` in ast to a+", () => {
    compareAst(
      "foo = a , { a };",
      {
        sequence: [
          { nonTerminal: "a" },
          { repetition: { nonTerminal: "a" }, skippable: true }
        ]
      },
      {
        repetition: { nonTerminal: "a" },
        skippable: false
      },
      {
        sequence: [
          { nonTerminal: "a" },
          { repetition: { nonTerminal: "a" }, skippable: true }
        ]
      }
    );
  });

  it("changes `( a ) , { a }` in ast to a+", () => {
    compareAst(
      "foo = ( a ) , { a };",
      {
        sequence: [
          { group: { nonTerminal: "a" } },
          { repetition: { nonTerminal: "a" }, skippable: true }
        ]
      },
      {
        repetition: { nonTerminal: "a" },
        skippable: false
      },
      {
        sequence: [
          { group: { nonTerminal: "a" } },
          { repetition: { nonTerminal: "a" }, skippable: true }
        ]
      }
    );
  });

  it(
    "changes `a, b, c, { d, e, b, c }` in ast to " +
      "`a, (b, c)+` with 'e, d' (reversed) as repeater",
    () => {
      compareAst(
        "foo = a, b, c, { d, e, b, c };",
        {
          sequence: [
            { nonTerminal: "a" },
            { nonTerminal: "b" },
            { nonTerminal: "c" },
            {
              repetition: {
                sequence: [
                  { nonTerminal: "d" },
                  { nonTerminal: "e" },
                  { nonTerminal: "b" },
                  { nonTerminal: "c" }
                ]
              },
              skippable: true
            }
          ]
        },
        {
          sequence: [
            { nonTerminal: "a" },
            {
              repetition: {
                sequence: [{ nonTerminal: "b" }, { nonTerminal: "c" }]
              },
              repeater: {
                sequence: [{ nonTerminal: "e" }, { nonTerminal: "d" }]
              },
              skippable: false
            }
          ]
        },
        {
          sequence: [
            { nonTerminal: "a" },
            { nonTerminal: "b" },
            { nonTerminal: "c" },
            {
              repetition: {
                sequence: [
                  { nonTerminal: "d" },
                  { nonTerminal: "e" },
                  { nonTerminal: "b" },
                  { nonTerminal: "c" }
                ]
              },
              skippable: true
            }
          ]
        }
      );
    }
  );

  it(
    "changes `a, b, c, { b, c }` in ast to " + "`a, (b, c)+` without repeater",
    () => {
      compareAst(
        "foo = a, b, c, { b, c };",
        {
          sequence: [
            { nonTerminal: "a" },
            { nonTerminal: "b" },
            { nonTerminal: "c" },
            {
              repetition: {
                sequence: [{ nonTerminal: "b" }, { nonTerminal: "c" }]
              },
              skippable: true
            }
          ]
        },
        {
          sequence: [
            { nonTerminal: "a" },
            {
              repetition: {
                sequence: [{ nonTerminal: "b" }, { nonTerminal: "c" }]
              },
              skippable: false
            }
          ]
        },
        {
          sequence: [
            { nonTerminal: "a" },
            { nonTerminal: "b" },
            { nonTerminal: "c" },
            {
              repetition: {
                sequence: [{ nonTerminal: "b" }, { nonTerminal: "c" }]
              },
              skippable: true
            }
          ]
        }
      );
    }
  );

  it("changes `a | a` into `a`", () => {
    compareAst(
      "foo = a | a;",
      { choice: [{ nonTerminal: "a" }, { nonTerminal: "a" }] },
      { nonTerminal: "a" }
    );
  });

  it("changes `[ { a } ]` into `{ a }`", () => {
    compareAst(
      "foo = [ { a } ];",
      { optional: { repetition: { nonTerminal: "a" }, skippable: true } },
      {
        repetition: { nonTerminal: "a" },
        skippable: true
      }
    );
  });

  it("changes `[ [ a ] ]` into `[ a ]`", () => {
    compareAst(
      "foo = [ [ a ] ];",
      { optional: { optional: { nonTerminal: "a" } } },
      { optional: { nonTerminal: "a" } }
    );
  });

  it("changes `a, b, c | a` into `a, [ b, c ]`", () => {
    compareAst(
      "foo = a, b, c | a;",
      {
        choice: [
          {
            sequence: [
              { nonTerminal: "a" },
              { nonTerminal: "b" },
              { nonTerminal: "c" }
            ]
          },
          { nonTerminal: "a" }
        ]
      },
      {
        sequence: [
          { nonTerminal: "a" },
          {
            optional: {
              sequence: [{ nonTerminal: "b" }, { nonTerminal: "c" }]
            }
          }
        ]
      },
      {
        choice: [
          {
            sequence: [
              { nonTerminal: "a" },
              { nonTerminal: "b" },
              { nonTerminal: "c" }
            ]
          },
          { nonTerminal: "a" }
        ]
      }
    );
  });

  it(
    "changes `a, b, c | a, d, e | a, f, e` into " +
      "`a, ( b, c | ( d | f ), e )`",
    () => {
      compareAst(
        "foo = x, y, z | a, b, c | a, b, d, e | a, b, f, e;",
        {
          choice: [
            {
              sequence: [
                { nonTerminal: "x" },
                { nonTerminal: "y" },
                { nonTerminal: "z" }
              ]
            },
            {
              sequence: [
                { nonTerminal: "a" },
                { nonTerminal: "b" },
                { nonTerminal: "c" }
              ]
            },
            {
              sequence: [
                { nonTerminal: "a" },
                { nonTerminal: "b" },
                { nonTerminal: "d" },
                { nonTerminal: "e" }
              ]
            },
            {
              sequence: [
                { nonTerminal: "a" },
                { nonTerminal: "b" },
                { nonTerminal: "f" },
                { nonTerminal: "e" }
              ]
            }
          ]
        },
        {
          choice: [
            {
              sequence: [
                { nonTerminal: "x" },
                { nonTerminal: "y" },
                { nonTerminal: "z" }
              ]
            },
            {
              sequence: [
                { nonTerminal: "a" },
                { nonTerminal: "b" },
                {
                  choice: [
                    { nonTerminal: "c" },
                    {
                      sequence: [
                        {
                          choice: [{ nonTerminal: "d" }, { nonTerminal: "f" }]
                        },
                        { nonTerminal: "e" }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          choice: [
            {
              sequence: [
                { nonTerminal: "x" },
                { nonTerminal: "y" },
                { nonTerminal: "z" }
              ]
            },
            {
              sequence: [
                { nonTerminal: "a" },
                { nonTerminal: "b" },
                { nonTerminal: "c" }
              ]
            },
            {
              sequence: [
                { nonTerminal: "a" },
                { nonTerminal: "b" },
                { nonTerminal: "d" },
                { nonTerminal: "e" }
              ]
            },
            {
              sequence: [
                { nonTerminal: "a" },
                { nonTerminal: "b" },
                { nonTerminal: "f" },
                { nonTerminal: "e" }
              ]
            }
          ]
        }
      );
    }
  );
});
