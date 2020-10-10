const { expect } = require("chai");
const { parseEbnf } = require("../../../src/main");
const { ebnfOptimizer } = require("../../../src/ast/ebnf-transform");
const repetition = require("../../../src/ast/optimizers/repetition");

describe("repetition", () => {
  it("leaves sequences that can not be optimized", () => {
    const text = 'definition = "a", "b", { "c" } ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([repetition])(ast);
    expect(result).to.eq(ast);
  });

  it("collapses items in repeats to non-skippable", () => {
    const text = 'definition = "a" , "b" , { "b" } , "c" ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([repetition])(ast);
    expect(result).to.eql([
      {
        identifier: "definition",
        definition: {
          sequence: [
            { terminal: "a" },
            {
              repetition: { terminal: "b" },
              skippable: false
            },
            { terminal: "c" }
          ]
        },
        location: 1
      }
    ]);
  });

  it("collapses items in repeats to non-skippable, with comment behind", () => {
    const text = 'definition = "a" , "b" , { "b" } (* comment *) , "c" ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([repetition])(ast);
    expect(result).to.eql([
      {
        identifier: "definition",
        definition: {
          sequence: [
            { terminal: "a" },
            {
              repetition: { terminal: "b" },
              skippable: false
            },
            { comment: " comment " },
            { terminal: "c" }
          ]
        },
        location: 1
      }
    ]);
  });

  it("supports picking fragments to collapse into repeats", () => {
    const text = 'definition = "a" , "b", "c", { "b", "c" } , "d" ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([repetition])(ast);
    expect(result).to.eql([
      {
        identifier: "definition",
        definition: {
          sequence: [
            { terminal: "a" },
            {
              repetition: { sequence: [{ terminal: "b" }, { terminal: "c" }] },
              skippable: false
            },
            { terminal: "d" }
          ]
        },
        location: 1
      }
    ]);
  });

  it("supports grouped choice to turn into repeat", () => {
    const text = 'definition = "a" , ( "b" | "c" ) , { "b" | "c" } , "d" ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([repetition])(ast);
    expect(result).to.eql([
      {
        identifier: "definition",
        definition: {
          sequence: [
            { terminal: "a" },
            {
              repetition: { choice: [{ terminal: "b" }, { terminal: "c" }] },
              skippable: false
            },
            { terminal: "d" }
          ]
        },
        location: 1
      }
    ]);
  });

  it("recognizes 'between' elements of repetition", () => {
    const text = 'definition = "a" , "b", "c", { "v", "g", "b", "c" } , "d" ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([repetition])(ast);
    expect(result).to.eql([
      {
        identifier: "definition",
        definition: {
          sequence: [
            { terminal: "a" },
            {
              repetition: { sequence: [{ terminal: "b" }, { terminal: "c" }] },
              repeater: { sequence: [{ terminal: "g" }, { terminal: "v" }] },
              skippable: false
            },
            { terminal: "d" }
          ]
        },
        location: 1
      }
    ]);
  });

  it("removes sequence if repetition captures whole sequence", () => {
    const text = 'definition =  "b", "c", { "v", "g", "b", "c" } ;';
    const ast = parseEbnf(text);
    const result = ebnfOptimizer([repetition])(ast);
    expect(result).to.eql([
      {
        identifier: "definition",
        definition: {
          repetition: { sequence: [{ terminal: "b" }, { terminal: "c" }] },
          repeater: { sequence: [{ terminal: "g" }, { terminal: "v" }] },
          skippable: false
        },
        location: 1
      }
    ]);
  });
});
