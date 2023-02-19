const { expect } = require("chai");
const { parseEbnf } = require("../src/main");
const { dedent } = require("../src/dedent");

describe("EBNF parser", () => {
  it("supports comments", () => {
    const text = "(* Comment data *)";
    const result = parseEbnf(text);
    expect(result).to.eql([
      {
        comment: " Comment data ",
      },
    ]);
  });

  it("supports defintions", () => {
    const text = 'foo = "bar";';
    const result = parseEbnf(text);
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.have.property("identifier").eq("foo");
    expect(result[0]).to.have.property("definition");
  });

  it("supports CamelCase identifiers", () => {
    const text = 'FooBar = "baz";';
    const result = parseEbnf(text);
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.have.property("identifier").eq("FooBar");
    expect(result[0]).to.have.property("definition");
  });

  it("supports multiple definitions", () => {
    const text = dedent(`
        foo = "bar";
        baz = "qux";
      `);
    const result = parseEbnf(text);
    expect(result).to.have.lengthOf(2);
    expect(result[0]).to.have.property("identifier").eq("foo");
    expect(result[1]).to.have.property("identifier").eq("baz");
  });

  it("adds line numbers of start of definition", () => {
    const text = dedent(`
        foo =
          "bar";

        baz = "qux";
      `);
    const result = parseEbnf(text);
    expect(result).to.have.lengthOf(2);
    expect(result[0]).to.have.property("location").eq(2);
    expect(result[1]).to.have.property("location").eq(5);
  });

  it("supports terminals", () => {
    const text = 'foo = "bar";';
    const result = parseEbnf(text);
    const firstDefinition = result[0].definition;
    expect(firstDefinition).to.eql({ terminal: "bar" });
  });

  it("supports non-terminals", () => {
    const text = "foo = bar;";
    const result = parseEbnf(text);
    const firstDefinition = result[0].definition;
    expect(firstDefinition).to.eql({ nonTerminal: "bar" });
  });

  it("supports sequences", () => {
    const text = dedent(`
        foo = "a", b,
          'c';
      `);
    const result = parseEbnf(text);
    const firstDefinition = result[0].definition;
    expect(firstDefinition).to.eql({
      sequence: [{ terminal: "a" }, { nonTerminal: "b" }, { terminal: "c" }],
    });
  });

  it("supports choices", () => {
    const text = 'foo = "a" | b ! c / "d";';
    const result = parseEbnf(text);
    const firstDefinition = result[0].definition;
    expect(firstDefinition).to.eql({
      choice: [
        { terminal: "a" },
        { nonTerminal: "b" },
        { nonTerminal: "c" },
        { terminal: "d" },
      ],
    });
  });

  it("choice has a higher precedence than sequence", () => {
    const text = 'foo = "a" | b, c;';
    const result = parseEbnf(text);
    const firstDefinition = result[0].definition;
    expect(firstDefinition).to.eql({
      choice: [
        { terminal: "a" },
        { sequence: [{ nonTerminal: "b" }, { nonTerminal: "c" }] },
      ],
    });
  });

  it("supports grouping", () => {
    const text = 'foo = ( "a" | b ), c;';
    const result = parseEbnf(text);
    const firstDefinition = result[0].definition;
    expect(firstDefinition).to.eql({
      sequence: [
        {
          group: {
            choice: [{ terminal: "a" }, { nonTerminal: "b" }],
          },
        },
        { nonTerminal: "c" },
      ],
    });
  });

  it("supports optionals", () => {
    const text = 'foo = [ "a" ], (/ "b" /);';
    const result = parseEbnf(text);
    const firstDefinition = result[0].definition;
    expect(firstDefinition).to.eql({
      sequence: [
        { optional: { terminal: "a" } },
        { optional: { terminal: "b" } },
      ],
    });
  });

  it("supports repetition", () => {
    const text = 'foo = { "a" } / (: "b" :);';
    const result = parseEbnf(text);
    const firstDefinition = result[0].definition;
    expect(firstDefinition).to.eql({
      choice: [
        { repetition: { terminal: "a" }, skippable: true },
        { repetition: { terminal: "b" }, skippable: true },
      ],
    });
  });

  it("supports repetition with multiplier", () => {
    const text = 'foo = 5 * "a";';
    const result = parseEbnf(text);
    const firstDefinition = result[0].definition;
    expect(firstDefinition).to.eql({
      repetition: { terminal: "a" },
      amount: "5",
    });
  });

  it("supports special sequences", () => {
    const text = "foo = ? a-z ?;";
    const result = parseEbnf(text);
    const firstDefinition = result[0].definition;
    expect(firstDefinition).to.eql({
      specialSequence: "a-z",
    });
  });

  it("supports nonTerminal excluding terminal", () => {
    const text = 'foo = bar - "baz".';
    const result = parseEbnf(text);
    const firstDefinition = result[0].definition;
    expect(firstDefinition).to.eql({
      include: "bar",
      exceptTerminal: "baz",
    });
  });

  it("supports nonTerminal excluding nonTerminal", () => {
    const text = "foo = bar - baz.";
    const result = parseEbnf(text);
    const firstDefinition = result[0].definition;
    expect(firstDefinition).to.eql({
      include: "bar",
      exceptNonTerminal: "baz",
    });
  });

  it("supports comments within definitions", () => {
    const text = 'foo = "bar" (* baz *);';
    const result = parseEbnf(text);
    const firstDefinition = result[0].definition;
    expect(firstDefinition).to.eql({
      group: { terminal: "bar" },
      comment: " baz ",
    });
  });

  describe("error handling", () => {
    it("produces an exception with error data for parse errors", () => {
      const text = 'foo = "bar" ( baz *);';
      expect(() => parseEbnf(text)).to.throw(Error, "Parse error on line 1:");

      let exception;
      try {
        parseEbnf(text);
      } catch (e) {
        exception = e;
      }
      expect(exception.data.line).to.eql(1);
      expect(exception.data.pos).to.eql(12);
      expect(exception.data.expected).to.eql([
        "';'",
        "','",
        "'|'",
        "'}'",
        "')'",
        "']'",
        "'COMMENT'",
      ]);
      expect(exception.data.token).to.eql("'('");
    });

    it("produces an exception with error data for lex errors", () => {
      const text = 'f^oo = "bar" (* baz *);';
      expect(() => parseEbnf(text)).to.throw(Error, "Parse error on line 1:");

      let exception;
      try {
        parseEbnf(text);
      } catch (e) {
        exception = e;
      }
      expect(exception.data.line).to.eql(1);
      expect(exception.data.pos).to.eql(2);
      expect(exception.data.expected).to.eql(["'='"]);
      expect(exception.data.token).to.eql("'^'");
    });
  });
});
