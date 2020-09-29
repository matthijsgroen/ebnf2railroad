const { expect } = require("chai");
const { parseEbnf } = require("../../../src/main");
const { ebnfOptimizer } = require("../../../src/ast/ebnf-transform");
const { print } = require("../../../src/ast/pretty-print");
const optionalChoices = require("../../../src/ast/optimizers/optional-choices");

describe("optional choices", () => {
  it("leaves groups that cannot be optmized alone", () => {
    const text = 'definition = "a", "b", [ "c" | "d" ] ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([optionalChoices])(ast);
    expect(result).to.eq(ast);
  });

  it("changes the optional over the choice if an option is optional", () => {
    const text = 'definition = "a" | "b" | [ "c" ] | "d" ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([optionalChoices])(ast);
    expect(print(result)).to.eql('definition = [ "a" | "b" | "c" | "d" ] ;');
    expect(result).to.eql([
      {
        identifier: "definition",
        definition: {
          optional: {
            choice: [
              { terminal: "a" },
              { terminal: "b" },
              { terminal: "c" },
              { terminal: "d" }
            ]
          }
        },
        location: 1
      }
    ]);
  });

  it("verifies if node is still a choice", () => {
    const text = 'definition = "a" | "b" | [ "c" ] | "d" ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([optionalChoices, optionalChoices])(ast);
    expect(print(result)).to.eql('definition = [ "a" | "b" | "c" | "d" ] ;');
    expect(result).to.eql([
      {
        identifier: "definition",
        definition: {
          optional: {
            choice: [
              { terminal: "a" },
              { terminal: "b" },
              { terminal: "c" },
              { terminal: "d" }
            ]
          }
        },
        location: 1
      }
    ]);
  });
});
