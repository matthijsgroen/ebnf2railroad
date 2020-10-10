const { expect } = require("chai");
const { parseEbnf } = require("../../../src/main");
const { ebnfOptimizer } = require("../../../src/ast/ebnf-transform");
const { productionToEBNF: print } = require("../../../src/ebnf-builder");
const unwrapOptional = require("../../../src/ast/optimizers/unwrap-optional");

describe("unwrap optionals", () => {
  it("leaves optionals that cannot be optmized alone", () => {
    const text = 'definition = "a", "b", [ "c" | "d" ] ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([unwrapOptional])(ast);
    expect(result).to.eql(ast);
  });

  it("removes optionals that contain optionals", () => {
    const text = 'definition = "a", "b", [ [ [ "c" | "d" ] ] ];';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([unwrapOptional])(ast);
    expect(print(result)).to.eql('definition = "a" , "b" , [ "c" | "d" ] ;');
    expect(result).to.eql([
      {
        identifier: "definition",
        location: 1,
        definition: {
          sequence: [
            { terminal: "a" },
            { terminal: "b" },
            { optional: { choice: [{ terminal: "c" }, { terminal: "d" }] } }
          ]
        }
      }
    ]);
  });

  it("removes optionals that contain repetition", () => {
    const text = 'definition = "a", "b", [ { "c" | "d" } ] ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([unwrapOptional])(ast);
    expect(print(result)).to.eql('definition = "a" , "b" , { "c" | "d" } ;');
    expect(result).to.eql([
      {
        identifier: "definition",
        location: 1,
        definition: {
          sequence: [
            { terminal: "a" },
            { terminal: "b" },
            {
              repetition: {
                choice: [{ terminal: "c" }, { terminal: "d" }]
              },
              skippable: true
            }
          ]
        }
      }
    ]);
  });
});
