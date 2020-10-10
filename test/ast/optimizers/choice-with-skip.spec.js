const { expect } = require("chai");
const { parseEbnf } = require("../../../src/main");
const { ebnfOptimizer } = require("../../../src/ast/ebnf-transform");
const choiceWithSkip = require("../../../src/ast/optimizers/choice-with-skip");

describe("choice-with-skip", () => {
  it("leaves optionals that cannot be optmized alone", () => {
    const text = 'definition = "a", "b", [ "c" | "d" ] ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([choiceWithSkip])(ast);

    const result2 = ebnfOptimizer([choiceWithSkip])(result);
    expect(result).to.eq(result2);
  });

  it("adds skip option to choice", () => {
    const text = 'definition = "a", "b", [ "c" | "d" ];';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([choiceWithSkip])(ast);
    expect(result).to.eql([
      {
        identifier: "definition",
        location: 1,
        definition: {
          sequence: [
            { terminal: "a" },
            { terminal: "b" },
            {
              choice: [{ skip: true }, { terminal: "c" }, { terminal: "d" }]
            }
          ]
        }
      }
    ]);
  });

  it("makes repetitions mandatory", () => {
    const text = 'definition = "a", "b", [ "c" | { "d" } ];';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([choiceWithSkip])(ast);
    expect(result).to.eql([
      {
        identifier: "definition",
        location: 1,
        definition: {
          sequence: [
            { terminal: "a" },
            { terminal: "b" },
            {
              choice: [
                { skip: true },
                { terminal: "c" },
                { repetition: { terminal: "d" }, skippable: false }
              ]
            }
          ]
        }
      }
    ]);
  });

  it("makes repetitions mandatory in choices", () => {
    const text = 'definition = "a" | { "d" };';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([choiceWithSkip])(ast);
    expect(result).to.eql([
      {
        identifier: "definition",
        location: 1,
        definition: {
          choice: [
            { skip: true },
            { terminal: "a" },
            { repetition: { terminal: "d" }, skippable: false }
          ]
        }
      }
    ]);
  });
});
