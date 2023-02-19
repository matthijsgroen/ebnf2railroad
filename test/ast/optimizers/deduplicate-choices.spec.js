const { expect } = require("chai");
const { parseEbnf } = require("../../../src/main");
const { ebnfOptimizer } = require("../../../src/ast/ebnf-transform");
const { productionToEBNF: print } = require("../../../src/ebnf-builder");
const deduplicate = require("../../../src/ast/optimizers/deduplicate-choices");

describe("deduplicate choices", () => {
  it("leaves choices that don't have duplicates alone", () => {
    const text = 'definition = "a"| "b"|  "c" | "d"  ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([deduplicate])(ast);
    expect(result).to.eq(ast);
  });

  it("removes duplicate choices", () => {
    const text = 'definition = "a" | "b" |  "a" | "b"  ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([deduplicate])(ast);
    expect(print(result)).to.eql('definition = "a" | "b" ;');
    expect(result).to.eql([
      {
        identifier: "definition",
        definition: {
          choice: [{ terminal: "a" }, { terminal: "b" }],
        },
        location: 1,
      },
    ]);
  });

  it("removes entire choice when only one choice left", () => {
    const text = 'definition = "a" | "a" ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([deduplicate])(ast);
    expect(print(result)).to.eql('definition = "a" ;');
    expect(result).to.eql([
      {
        identifier: "definition",
        definition: { terminal: "a" },
        location: 1,
      },
    ]);
  });

  it("keeps version that has a comment", () => {
    const text = 'definition = "a"| "b"| "c" (* comment *)| "c" ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([deduplicate])(ast);
    expect(print(result)).to.eql(
      'definition = "a" | "b" | "c" (* comment *) ;'
    );
    expect(result).to.eql([
      {
        identifier: "definition",
        definition: {
          choice: [
            { terminal: "a" },
            { terminal: "b" },
            { group: { terminal: "c" }, comment: " comment " },
          ],
        },
        location: 1,
      },
    ]);
  });

  it("leaves choices that cannot be optmized alone", () => {
    const text =
      'definition = "a"| "b"| "c" (* comment 1 *)| "c" (* comment 2 *) ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([deduplicate])(ast);
    expect(result).to.eq(ast);
  });

  it("deduplicates commments", () => {
    const text =
      'definition = "a"| "b"| "c" (* comment 1 *)| "c" (* comment 1 *) ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([deduplicate])(ast);
    expect(print(result)).to.eql(
      'definition = "a" | "b" | "c" (* comment 1 *) ;'
    );
    expect(result).to.eql([
      {
        identifier: "definition",
        definition: {
          choice: [
            { terminal: "a" },
            { terminal: "b" },
            { group: { terminal: "c" }, comment: " comment 1 " },
          ],
        },
        location: 1,
      },
    ]);
  });
});
