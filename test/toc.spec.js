const { expect } = require("chai");
const { parser } = require("../src/ebnf-parser");
const { dedent } = require("../src/dedent");
const {
  createAlphabeticalToc,
  createStructuralToc,
  createToc
} = require("../src/toc");

describe("table of contents", () => {
  const ebnfDefinition = dedent(`
    string = '"', { lowercase letter }, '"';
    statement = "a" | string | condition;
    (* comment *)
    comment = "/*", { lowercase letter }, "*/";
    root = statement | comment;
    condition = "if", condition, "then", statement, { statement };
    lowercase letter = ? letters ?;
    second root = 'foo', branch | leaf;
    branch = leaf | second root;
    leaf = "leaf";
  `);

  const ast = parser.parse(ebnfDefinition);

  describe("createAlphabeticalToc", () => {
    it("creates a list of links in alphabetical order", () => {
      const result = createAlphabeticalToc(ast);
      expect(result).to.eql([
        { name: "branch" },
        { name: "comment" },
        { name: "condition" },
        { name: "leaf" },
        { name: "lowercase letter" },
        { name: "root" },
        { name: "second root" },
        { name: "statement" },
        { name: "string" }
      ]);
    });
  });

  describe("createStructuralToc", () => {
    it("creates a tree of links containing all nodes", () => {
      const result = createStructuralToc(ast);
      expect(result).to.eql([
        {
          name: "root",
          children: [
            {
              name: "statement",
              children: [
                {
                  name: "string",
                  children: [{ name: "lowercase letter" }]
                },
                {
                  name: "condition",
                  children: [
                    { name: "condition", recursive: true },
                    { name: "statement", recursive: true }
                  ]
                }
              ]
            },
            {
              name: "comment",
              children: [{ name: "lowercase letter" }]
            }
          ]
        },
        {
          name: "second root",
          children: [
            {
              name: "branch",
              children: [
                { name: "leaf" },
                { name: "second root", recursive: true }
              ]
            },
            { name: "leaf" }
          ]
        }
      ]);
    });
  });

  describe("createToc", () => {
    it("creates a list of links in original defined order", () => {
      const result = createToc(ast);
      expect(result).to.eql([
        { name: "string" },
        { name: "statement" },
        { name: "comment" },
        { name: "root" },
        { name: "condition" },
        { name: "lowercase letter" },
        { name: "second root" },
        { name: "branch" },
        { name: "leaf" }
      ]);
    });
  });
});
