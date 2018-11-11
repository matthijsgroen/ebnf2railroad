const { expect } = require("chai");
const { parser } = require("../src/ebnf-parser");
const { productionToEBNF } = require("../src/ebnf-builder");

describe("EBNF Builder", () => {
  describe("plain comments", () => {
    it("passes them through in non-markup mode", () => {
      const text = "(* Comment data *)";
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0]);
      expect(result).to.eql("(* Comment data *)");
    });

    it("wraps in span in markup mode", () => {
      const text = "(* Comment data *)";
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0], { markup: true });
      expect(result).to.eql(
        '<span class="ebnf-comment">(* Comment data *)</span>'
      );
    });
  });

  describe("sanitizing HTML", () => {
    it("sanitizes html in markup mode", () => {
      const text = 'hello = "<h1>content</h1>";';
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0].definition, { markup: true });
      expect(result).to.eql(
        '<span class="ebnf-terminal">' +
          '"&lt;h1&gt;content&lt;/h1&gt;"' +
          "</span>"
      );
    });

    it("does not sanitize html in plain mode", () => {
      const text = 'hello = "<h1>content</h1>";';
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0].definition, { markup: false });
      expect(result).to.eql('"<h1>content</h1>"');
    });
  });

  describe("using primary iso characters", () => {
    it("converts alternative characters to primary ones", () => {
      const text = "hello = a / b, (: c :), (/ d /) ! e .";
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0], { markup: false });
      expect(result).to.eql("hello = a | b , { c } , [ d ] | e;");
    });
  });

  describe("choice lists", () => {
    it("converts a root choice list to a multiline statement, when less than 6 items", () => {
      const text =
        "statement = function call | if condition | assignment | loop;";
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0], { markup: false, format: true });
      expect(result).to.eql(
        "statement\n" +
          "  = function call\n" +
          "  | if condition\n" +
          "  | assignment\n" +
          "  | loop\n" +
          "  ;"
      );
    });

    it("converts a root choice list to a multiline statement, when more than 6 items, as a grid", () => {
      const text = "statement = a|b|c|d|e|f|ghijkl|m|n|o|p|q|rs|t;";
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0], { markup: false, format: true });
      expect(result).to.eql(
        "statement\n" +
          "  = a | b      | c  | d | e\n" +
          "  | f | ghijkl | m  | n | o\n" +
          "  | p | q      | rs | t\n" +
          "  ;"
      );
    });

    it("converts a repeater choice list to a multiline statement", () => {
      const text = "statement = a, { b | d | e | gh| j }, e;";
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0], { markup: false, format: true });
      expect(result).to.eql(
        "statement = a , \n" +
          "  { b\n" +
          "  | d\n" +
          "  | e\n" +
          "  | gh\n" +
          "  | j\n" +
          "  } , e;"
      );
    });
  });

  describe("sequences", () => {
    it("wraps to multiline for long sequences", () => {
      const text =
        "statement = a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,uu,v,w,q,y,z;";
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0], { markup: false, format: true });
      expect(result).to.eql(
        "statement = a , b , c , d , e , f , g , h ,\n" +
          "  i , j , k , l , m , n , o , p , q , r , s ,\n" +
          "  t , uu , v , w , q , y , z;"
      );
    });

    it("takes into account item length", () => {
      const text =
        "statement = abcdef something very long,g,hijklm,n,o,p,q,r,s,t,uu,v,w,q,y,z;";
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0], { markup: false, format: true });
      expect(result).to.eql(
        "statement = abcdef something very long , g ,\n" +
          "  hijklm , n , o , p , q , r , s , t , uu , v ,\n" +
          "  w , q , y , z;"
      );
    });
  });
});
