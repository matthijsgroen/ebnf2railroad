const { expect } = require("chai");
const { parseEbnf } = require("../../../src/main");
const { ebnfOptimizer } = require("../../../src/ast/ebnf-transform");
const { print } = require("../../../src/ast/pretty-print");
const ungroup = require("../../../src/ast/optimizers/ungroup");

describe("ungroup", () => {
  it("leaves groups that cannot be optmized alone", () => {
    const text = 'definition = "a", "b", ( "c" | "d" ) ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([ungroup])(ast);
    expect(result).to.eq(ast);
  });

  it("leaves groups that cannot be optmized alone", () => {
    const text = 'definition = "a", "b", "c" (* comment *), "d" ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([ungroup])(ast);
    expect(result).to.eq(ast);
  });

  it("removes groups if possible (sequence in choice)", () => {
    const text = 'definition = "a" | "b" | ( "c" , "d" ) ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([ungroup])(ast);
    expect(print(result)).to.eql('definition = "a" | "b" | "c" , "d" ;');
    expect(result).to.eql([
      {
        identifier: "definition",
        definition: {
          choice: [
            { terminal: "a" },
            { terminal: "b" },
            {
              sequence: [{ terminal: "c" }, { terminal: "d" }]
            }
          ]
        },
        location: 1
      }
    ]);
  });

  it("removes groups if possible (leaves)", () => {
    const text = 'definition = "a", "b", ( "c" ), ( d ) ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([ungroup])(ast);
    expect(print(result)).to.eql('definition = "a" , "b" , "c" , d ;');
    expect(result).to.eql([
      {
        identifier: "definition",
        definition: {
          sequence: [
            { terminal: "a" },
            { terminal: "b" },
            { terminal: "c" },
            { nonTerminal: "d" }
          ]
        },
        location: 1
      }
    ]);
  });

  it("removes groups if possible (sequence)", () => {
    const text = 'definition = "a", "b", ( "c" , "d" ) ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([ungroup])(ast);
    expect(print(result)).to.eql('definition = "a" , "b" , "c" , "d" ;');
    expect(result).to.eql([
      {
        identifier: "definition",
        definition: {
          sequence: [
            { terminal: "a" },
            { terminal: "b" },
            { terminal: "c" },
            { terminal: "d" }
          ]
        },
        location: 1
      }
    ]);
  });

  it("removes groups if possible (choice)", () => {
    const text = 'definition = "a" | "b" | ( "c" | "d" ) ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([ungroup])(ast);
    expect(print(result)).to.eql('definition = "a" | "b" | "c" | "d" ;');
    expect(result).to.eql([
      {
        identifier: "definition",
        definition: {
          choice: [
            { terminal: "a" },
            { terminal: "b" },
            { terminal: "c" },
            { terminal: "d" }
          ]
        },
        location: 1
      }
    ]);
  });
});
