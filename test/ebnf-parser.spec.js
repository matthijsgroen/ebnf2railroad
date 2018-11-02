const { expect } = require("chai");
const { parser } = require("../src/ebnf-parser");
const { dedent } = require("../src/dedent");

describe("EBNF parser", () => {
  describe("creates an AST structure", () => {
    it("supports comments", () => {
      const text = dedent(`
        (* Comment data *)
      `);
      const result = parser.parse(text);
      expect(result).to.eql([
        {
          comment: " Comment data "
        }
      ]);
    });

    it("supports defintions", () => {
      const text = dedent(`
        foo = "bar";
      `);
      const result = parser.parse(text);
      expect(result).to.have.lengthOf(1);
      expect(result[0])
        .to.have.property("identifier")
        .eq("foo");
      expect(result[0]).to.have.property("definition");
    });

    it("supports multiple definitions", () => {
      const text = dedent(`
        foo = "bar";
        baz = "qux";
      `);
      const result = parser.parse(text);
      expect(result).to.have.lengthOf(2);
      expect(result[0])
        .to.have.property("identifier")
        .eq("foo");
      expect(result[1])
        .to.have.property("identifier")
        .eq("baz");
    });

    it("adds line numbers of start of definition", () => {
      const text = dedent(`
        foo =
          "bar";

        baz = "qux";
      `);
      const result = parser.parse(text);
      expect(result).to.have.lengthOf(2);
      expect(result[0])
        .to.have.property("location")
        .eq(2);
      expect(result[1])
        .to.have.property("location")
        .eq(5);
    });

    it("supports terminals", () => {
      const text = dedent(`
        foo = "bar";
      `);
      const result = parser.parse(text);
      const firstDefinition = result[0].definition;
      expect(firstDefinition).to.eql({ terminal: "bar" });
    });

    it("supports non-terminals", () => {
      const text = dedent(`
        foo = bar;
      `);
      const result = parser.parse(text);
      const firstDefinition = result[0].definition;
      expect(firstDefinition).to.eql({ nonTerminal: "bar" });
    });

    it("supports sequences", () => {
      const text = dedent(`
        foo = "a", b,
          'c';
      `);
      const result = parser.parse(text);
      const firstDefinition = result[0].definition;
      expect(firstDefinition).to.eql({
        sequence: [{ terminal: "a" }, { nonTerminal: "b" }, { terminal: "c" }]
      });
    });

    it("supports choices", () => {
      const text = dedent(`
        foo = "a" | b;
      `);
      const result = parser.parse(text);
      const firstDefinition = result[0].definition;
      expect(firstDefinition).to.eql({
        choice: [{ terminal: "a" }, { nonTerminal: "b" }]
      });
    });

    it("choice has a higher precedence than sequence", () => {
      const text = dedent(`
        foo = "a" | b, c;
      `);
      const result = parser.parse(text);
      const firstDefinition = result[0].definition;
      expect(firstDefinition).to.eql({
        choice: [
          { terminal: "a" },
          { sequence: [{ nonTerminal: "b" }, { nonTerminal: "c" }] }
        ]
      });
    });

    it("supports grouping", () => {
      const text = dedent(`
        foo = ( "a" | b ), c;
      `);
      const result = parser.parse(text);
      const firstDefinition = result[0].definition;
      expect(firstDefinition).to.eql({
        sequence: [
          {
            group: {
              choice: [{ terminal: "a" }, { nonTerminal: "b" }]
            }
          },
          { nonTerminal: "c" }
        ]
      });
    });

    it("supports optionals", () => {
      const text = dedent(`
        foo = [ "a" ];
      `);
      const result = parser.parse(text);
      const firstDefinition = result[0].definition;
      expect(firstDefinition).to.eql({
        optional: { terminal: "a" }
      });
    });

    it("supports repetition", () => {
      const text = dedent(`
        foo = { "a" };
      `);
      const result = parser.parse(text);
      const firstDefinition = result[0].definition;
      expect(firstDefinition).to.eql({
        repetition: { terminal: "a" },
        skippable: true
      });
    });

    it("supports repetition with multiplier", () => {
      const text = dedent(`
        foo = 5 * "a";
      `);
      const result = parser.parse(text);
      const firstDefinition = result[0].definition;
      expect(firstDefinition).to.eql({
        repetition: { terminal: "a" },
        amount: "5"
      });
    });

    it("supports special sequences", () => {
      const text = dedent(`
        foo = ? a-z ?;
      `);
      const result = parser.parse(text);
      const firstDefinition = result[0].definition;
      expect(firstDefinition).to.eql({
        specialSequence: "a-z"
      });
    });

    it("supports nonTerminal excluding terminal", () => {
      const text = dedent(`
        foo = bar - "baz".
      `);
      const result = parser.parse(text);
      const firstDefinition = result[0].definition;
      expect(firstDefinition).to.eql({
        include: "bar",
        exceptTerminal: "baz"
      });
    });

    it("supports nonTerminal excluding nonTerminal", () => {
      const text = dedent(`
        foo = bar - baz.
      `);
      const result = parser.parse(text);
      const firstDefinition = result[0].definition;
      expect(firstDefinition).to.eql({
        include: "bar",
        exceptNonTerminal: "baz"
      });
    });

    it("comments within definitions", () => {
      const text = dedent(`
        foo = "bar" (* baz *);
      `);
      const result = parser.parse(text);
      const firstDefinition = result[0].definition;
      expect(firstDefinition).to.eql({
        group: { terminal: "bar" },
        comment: " baz "
      });
    });
  });
});
