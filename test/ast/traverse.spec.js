const { expect } = require("chai");
const { parseEbnf } = require("../../src/main");
const { traverse } = require("../../src/ast/traverse");

describe("traverse", () => {
  describe("travelling", () => {
    it("classifies node upon travel", () => {
      const text = 'definition = "a", "b", ( "c" | "d" ) ;';
      const ast = parseEbnf(text);
      let classified = false;

      const classifier = node => (Array.isArray(node) ? "root" : "other");
      const travelers = {
        root: () => {
          classified = true;
        }
      };
      const transformers = [];

      traverse(classifier)(travelers)(transformers)(ast);

      expect(classified).to.be.true;
    });

    it("uses the classification to travel through nodes", () => {
      const text = 'definition = "a", "b", ( "c" | "d" ) ;';
      const ast = parseEbnf(text);
      let traveled = false;

      const classifier = node =>
        Array.isArray(node) ? "root" : node.identifier ? "branch" : "leaf";
      const travelers = {
        root: (root, next) => root.map(next),
        branch: () => {
          traveled = true;
        }
      };
      const transformers = [];

      traverse(classifier)(travelers)(transformers)(ast);

      expect(traveled).to.be.true;
    });

    it("uses the classification to travel through nodes (all branches)", () => {
      const text = 'definition = "a", "b", ( "c" | "d" ) ;';
      const ast = parseEbnf(text);
      let leafs = [];

      const classifier = node =>
        Array.isArray(node)
          ? "root"
          : node.identifier
            ? "definition"
            : node.sequence
              ? "sequence"
              : node.group
                ? "group"
                : node.choice
                  ? "choice"
                  : "leaf";

      const travelers = {
        root: (root, next) => root.map(next),
        definition: (definition, next) => ({
          ...definition,
          defintion: next(definition.definition)
        }),
        sequence: (sequence, next) => ({
          ...sequence,
          sequence: sequence.sequence.map(next)
        }),
        group: (group, next) => ({
          ...group,
          group: next(group.group)
        }),
        choice: (choice, next) => ({
          ...choice,
          choice: choice.choice.map(next)
        })
      };
      const transformers = [
        node => {
          if (node.terminal) {
            leafs.push(node.terminal);
          }
        }
      ];
      traverse(classifier)(travelers)(transformers)(ast);

      expect(leafs).to.eql(["a", "b", "c", "d"]);
    });
  });
  describe("transforming", () => {
    const classifier = node =>
      Array.isArray(node)
        ? "root"
        : node.identifier
          ? "definition"
          : node.sequence
            ? "sequence"
            : node.group
              ? "group"
              : node.choice
                ? "choice"
                : "leaf";

    const travelers = {
      root: (root, next) => root.map(next),
      definition: (definition, next) => ({
        ...definition,
        definition: next(definition.definition)
      }),
      sequence: (sequence, next) => ({
        ...sequence,
        sequence: sequence.sequence.map(next)
      }),
      group: (group, next) => ({
        ...group,
        group: next(group.group)
      }),
      choice: (choice, next) => ({
        ...choice,
        choice: choice.choice.map(next)
      })
    };

    it("returns the same node if no transformers specified", () => {
      const text = 'definition = "a", "b", ( "c" | "d" ) ;';
      const ast = parseEbnf(text);

      const transformers = [];
      const result = traverse(classifier)(travelers)(transformers)(ast);

      expect(result).to.eql(ast);
    });

    it("returns the same node if no transformation happened", () => {
      const text = 'definition = "a", "b", ( "c" | "d" ) ;';
      const ast = parseEbnf(text);

      const transformers = [node => node];
      const result = traverse(classifier)(travelers)(transformers)(ast);

      expect(result).to.eql(ast);
    });

    it("can transform the AST into something else", () => {
      const text = 'definition = "a", "b", ( "c" | "d" ) ;';
      const ast = parseEbnf(text);

      const transformers = [
        {
          root: root => root.join("\n"),
          definition: definition =>
            `${definition.identifier} = ${definition.definition};`,
          sequence: sequence => sequence.sequence.join(", "),
          group: group => `( ${group.group} )`,
          choice: choice => choice.choice.join(" | "),
          leaf: terminal => `"${terminal.terminal}${terminal.terminal}"`
        }
      ];
      const result = traverse(classifier)(travelers)(transformers)(ast);

      expect(result).to.eql('definition = "aa", "bb", ( "cc" | "dd" );');
    });
  });
});
