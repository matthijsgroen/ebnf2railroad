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

    it("supports comments before optional", () => {
      const text = "statement = item, (* Comment data *) [ extra ];";
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0]);
      expect(result).to.eql(
        "statement = item , (* Comment data *) [ extra ] ;"
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
      expect(result).to.eql("hello = a | b , { c } , [ d ] | e ;");
    });
  });

  describe("choice lists", () => {
    it("does not convert a root choice list to a multiline statement, when 2 short items", () => {
      const text = "statement = function call | if condition;";
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0], { markup: false, format: true });
      expect(result).to.eql("statement = function call | if condition ;");
    });

    it("converts a root choice list to a multiline statement, when 2 long items", () => {
      const text =
        'time calculation = time value , "-" , duration value | time value , "+" , duration value;';
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0], { markup: false, format: true });
      expect(result).to.eql(
        "time calculation\n" +
          '  = time value , "-" , duration value\n' +
          '  | time value , "+" , duration value\n' +
          "  ;"
      );
    });

    it("converts a root choice list to a multiline statement, when between 3 and 6 items", () => {
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
      const text = "statement = a|b|cd|e|f|ghi|jkl|m|n|o|p|q|rs|t;";
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0], { markup: false, format: true });
      expect(result).to.eql(
        "statement\n" +
          "  = a | b | cd | e | f | ghi | jkl\n" +
          "  | m | n | o  | p | q | rs  | t\n" +
          "  ;"
      );
      const rawResult = productionToEBNF(ast[0], {
        markup: false,
        format: false
      });
      expect(rawResult).to.eql(
        "statement = a | b | cd | e | f | ghi | jkl | m | n | o | p | q | rs | t ;"
      );
    });

    it("does not convert a repeater choice list to a multiline statement when short choices", () => {
      const text = "statement = a, { b | d | e | gh| j }, e;";
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0], { markup: false, format: true });
      expect(result).to.eql("statement = a , { b | d | e | gh | j } , e ;");
    });

    it("converts a repeater choice list to a multiline statement", () => {
      const text =
        "statement = a, { b | having a few long options | e | gh| j }, e;";
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0], { markup: false, format: true });
      expect(result).to.eql(
        "statement = a ,\n" +
          "  { b\n" +
          "  | having a few long options\n" +
          "  | e\n" +
          "  | gh\n" +
          "  | j\n" +
          "  } , e ;"
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
        "statement = a , b , c , d , e , f , g , h , i , j ,\n" +
          "  k , l , m , n , o , p , q , r , s , t , uu , v , w ,\n" +
          "  q , y , z ;"
      );
    });

    it("takes into account item length", () => {
      const text =
        "statement = abcdef something very long,g,hijklm,n,o,p,q,r,s,t,uu,v,w,q,y,z;";
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0], { markup: false, format: true });
      expect(result).to.eql(
        "statement = abcdef something very long , g , hijklm ,\n" +
          "  n , o , p , q , r , s , t , uu , v , w , q , y , z ;"
      );
      const rawResult = productionToEBNF(ast[0], {
        markup: false,
        format: false
      });
      expect(rawResult).to.eql(
        "statement = abcdef something very long , g , hijklm , n , o , p , q , r , s , t , uu , v , w , q , y , z ;"
      );
    });

    it("uses a margin to prevent wrapping short pieces at the end", () => {
      const text = 'gamut = "[" , gamut float , "," , gamut float , "]";';
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0], { markup: false, format: true });
      expect(result).to.eql(
        'gamut = "[" , gamut float , "," , gamut float , "]" ;'
      );
    });

    it("keeps stacking offset until linebreak", () => {
      const text =
        'function call with priority support = identifier , [ "!" ] ,\n' +
        ' "(" , [ argument value with mutators , { "," , argument value with mutators } ] , ")";';
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0], { markup: false, format: true });
      expect(result).to.eql(
        "function call with priority support = identifier ,\n" +
          '  [ "!" ] , "(" , [ argument value with mutators ,\n' +
          '  { "," , argument value with mutators } ] , ")" ;'
      );
    });
  });

  describe("combination tests", () => {
    it("creates a line length balance between lines", () => {
      const text = `
        if statement = "if" , condition , "then" , end of statement , indent , statement , { statement } , unindent , [ "else" ,
          end of statement , indent , statement , { statement } ,
          unindent | "else" ,
          if statement ];
      `;
      const ast = parser.parse(text);
      const result = productionToEBNF(ast[0], { markup: false, format: true });
      expect(result).to.eql(
        'if statement = "if" , condition , "then" , end of statement , indent , statement , { statement } , unindent ,\n' +
          '  [ "else" , end of statement , indent , statement ,\n' +
          "    { statement } , unindent\n" +
          '  | "else" , if statement\n' +
          "  ] ;"
      );
    });
  });
});
