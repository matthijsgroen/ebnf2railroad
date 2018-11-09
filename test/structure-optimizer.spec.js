const { expect } = require("chai");
const { parser } = require("../src/ebnf-parser");
const { optimizeProduction } = require("../src/structure-optimizer");

describe("AST structure optimizer", () => {
  it("does not mutate the input AST", () => {
    const text = "foo = a | [ b | c ];";
    const result = parser.parse(text);
    const inputDefinition = result[0].definition;
    const inputAst = {
      choice: [
        { nonTerminal: "a" },
        {
          optional: {
            choice: [{ nonTerminal: "b" }, { nonTerminal: "c" }]
          }
        }
      ]
    };
    expect(inputDefinition).to.eql(inputAst);
    const optimizedDefinition = optimizeProduction(inputDefinition);
    expect(optimizedDefinition).to.eql({
      choice: [
        { skip: true },
        { nonTerminal: "a" },
        { nonTerminal: "b" },
        { nonTerminal: "c" }
      ]
    });
    expect(inputDefinition).to.eql(inputAst);
  });

  it("changes `a | [ b ]` in ast to choice with skip", () => {
    const text = "foo = a | [ b ];";
    const result = parser.parse(text);
    const inputDefinition = result[0].definition;
    expect(inputDefinition).to.eql({
      choice: [{ nonTerminal: "a" }, { optional: { nonTerminal: "b" } }]
    });
    const optimizedDefinition = optimizeProduction(inputDefinition);
    expect(optimizedDefinition).to.eql({
      choice: [{ skip: true }, { nonTerminal: "a" }, { nonTerminal: "b" }]
    });
  });

  it("changes `a | b | [ b ]` in ast to choice with skip without duplicates", () => {
    const text = "foo = a | b | [ b ];";
    const result = parser.parse(text);
    const inputDefinition = result[0].definition;
    expect(inputDefinition).to.eql({
      choice: [
        { nonTerminal: "a" },
        { nonTerminal: "b" },
        { optional: { nonTerminal: "b" } }
      ]
    });
    const optimizedDefinition = optimizeProduction(inputDefinition);
    expect(optimizedDefinition).to.eql({
      choice: [{ skip: true }, { nonTerminal: "a" }, { nonTerminal: "b" }]
    });
  });

  it("changes `a | { b }` in ast to choice with skip, a and b+", () => {
    const text = "foo = a | { b };";
    const result = parser.parse(text);
    const inputDefinition = result[0].definition;
    expect(inputDefinition).to.eql({
      choice: [
        { nonTerminal: "a" },
        { repetition: { nonTerminal: "b" }, skippable: true }
      ]
    });
    const optimizedDefinition = optimizeProduction(inputDefinition);
    expect(optimizedDefinition).to.eql({
      choice: [
        { skip: true },
        { nonTerminal: "a" },
        { repetition: { nonTerminal: "b" }, skippable: false }
      ]
    });
  });

  it("merges multiple choices together (using optional)", () => {
    const text = "foo = a | [ b | c ];";
    const result = parser.parse(text);
    const inputDefinition = result[0].definition;
    const inputAst = {
      choice: [
        { nonTerminal: "a" },
        {
          optional: {
            choice: [{ nonTerminal: "b" }, { nonTerminal: "c" }]
          }
        }
      ]
    };
    expect(inputDefinition).to.eql(inputAst);
    const optimizedDefinition = optimizeProduction(inputDefinition);
    expect(optimizedDefinition).to.eql({
      choice: [
        { skip: true },
        { nonTerminal: "a" },
        { nonTerminal: "b" },
        { nonTerminal: "c" }
      ]
    });
  });

  it("merges multiple choices together (using group)", () => {
    const text = "foo = a | ( b | c );";
    const result = parser.parse(text);
    const inputDefinition = result[0].definition;
    const inputAst = {
      choice: [
        { nonTerminal: "a" },
        {
          group: {
            choice: [{ nonTerminal: "b" }, { nonTerminal: "c" }]
          }
        }
      ]
    };
    expect(inputDefinition).to.eql(inputAst);
    const optimizedDefinition = optimizeProduction(inputDefinition);
    expect(optimizedDefinition).to.eql({
      choice: [{ nonTerminal: "a" }, { nonTerminal: "b" }, { nonTerminal: "c" }]
    });
  });

  it("changes `[ a | b | c ]` into single choice with skip", () => {
    const text = "foo = [ a | b | c ];";
    const result = parser.parse(text);
    const inputDefinition = result[0].definition;
    expect(inputDefinition).to.eql({
      optional: {
        choice: [
          { nonTerminal: "a" },
          { nonTerminal: "b" },
          { nonTerminal: "c" }
        ]
      }
    });
    const optimizedDefinition = optimizeProduction(inputDefinition);
    expect(optimizedDefinition).to.eql({
      choice: [
        { skip: true },
        { nonTerminal: "a" },
        { nonTerminal: "b" },
        { nonTerminal: "c" }
      ]
    });
  });

  it("changes `a , { a }` in ast to a+", () => {
    const text = "foo = a , { a };";
    const result = parser.parse(text);
    const inputDefinition = result[0].definition;
    expect(inputDefinition).to.eql({
      sequence: [
        { nonTerminal: "a" },
        { repetition: { nonTerminal: "a" }, skippable: true }
      ]
    });
    const optimizedDefinition = optimizeProduction(inputDefinition);
    expect(optimizedDefinition).to.eql({
      repetition: { nonTerminal: "a" },
      skippable: false
    });
  });

  it("changes `( a ) , { a }` in ast to a+", () => {
    const text = "foo = ( a ) , { a };";
    const result = parser.parse(text);
    const inputDefinition = result[0].definition;
    expect(inputDefinition).to.eql({
      sequence: [
        { group: { nonTerminal: "a" } },
        { repetition: { nonTerminal: "a" }, skippable: true }
      ]
    });
    const optimizedDefinition = optimizeProduction(inputDefinition);
    expect(optimizedDefinition).to.eql({
      repetition: { nonTerminal: "a" },
      skippable: false
    });
  });

  it(
    "changes `a, b, c, { d, e, b, c }` in ast to " +
      "`a, (b, c)+` with 'e, d' (reversed) as repeater",
    () => {
      const text = "foo = a, b, c, { d, e, b, c };";
      const result = parser.parse(text);
      const inputDefinition = result[0].definition;
      expect(inputDefinition).to.eql({
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
      });
      const optimizedDefinition = optimizeProduction(inputDefinition);
      expect(optimizedDefinition).to.eql({
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
      });
    }
  );

  it("changes `a | a` into " + "`a`", () => {
    const text = "foo = a | a;";
    const result = parser.parse(text);
    const inputDefinition = result[0].definition;
    expect(inputDefinition).to.eql({
      choice: [{ nonTerminal: "a" }, { nonTerminal: "a" }]
    });
    const optimizedDefinition = optimizeProduction(inputDefinition);
    expect(optimizedDefinition).to.eql({ nonTerminal: "a" });
  });

  it("changes `a, b, c | a` into " + "`a, [ b, c ]`", () => {
    const text = "foo = a, b, c | a;";
    const result = parser.parse(text);
    const inputDefinition = result[0].definition;
    expect(inputDefinition).to.eql({
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
    });
    const optimizedDefinition = optimizeProduction(inputDefinition);
    expect(optimizedDefinition).to.eql({
      sequence: [
        { nonTerminal: "a" },
        {
          optional: {
            sequence: [{ nonTerminal: "b" }, { nonTerminal: "c" }]
          }
        }
      ]
    });
  });

  it(
    "changes `a, b, c | a, d, e | a, f, e` into " +
      "`a, ( b, c | ( d | f ), e )`",
    () => {
      const text = "foo = x, y, z | a, b, c | a, b, d, e | a, b, f, e;";
      const result = parser.parse(text);
      const inputDefinition = result[0].definition;
      expect(inputDefinition).to.eql({
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
      });
      const optimizedDefinition = optimizeProduction(inputDefinition);
      expect(optimizedDefinition).to.eql({
        choice: [
          {
            sequence: [
              { nonTerminal: "a" },
              { nonTerminal: "b" },
              {
                choice: [
                  {
                    sequence: [
                      {
                        choice: [{ nonTerminal: "d" }, { nonTerminal: "f" }]
                      },
                      { nonTerminal: "e" }
                    ]
                  },
                  { nonTerminal: "c" }
                ]
              }
            ]
          },
          {
            sequence: [
              { nonTerminal: "x" },
              { nonTerminal: "y" },
              { nonTerminal: "z" }
            ]
          }
        ]
      });
    }
  );
});
