const { expect } = require("chai");
const { parseEbnf } = require("../../src/main");
const { print, printFormatted } = require("../../src/ast/pretty-print");

describe("prettyPrint", () => {
  describe("simple text mode", () => {
    it("keeps the entire definition on a single line", () => {
      const text = `
        number = [ "-" ] , ( "0" | digit without zero , { digit } ) ,
          (* fraction *) [ "." , digit , { digit } ] ,
          (* exponent *) [ ( "e" | "E" ) , [ "+" | "-" ] , digit , { digit } ];
      `;
      const ast = parseEbnf(text);
      const printed = print(ast);

      expect(printed).to.eql(
        'number = [ "-" ] , ( "0" | digit without zero , { digit } ) , ' +
          '(* fraction *) [ "." , digit , { digit } ] , ' +
          '(* exponent *) [ ( "e" | "E" ) , [ "+" | "-" ] , digit , { digit } ] ;'
      );
    });

    [
      { goal: "terminals", input: 'item="=";', output: 'item = "=" ;' },
      {
        goal: "terminals containing quote",
        input: "item = '\"' ;",
        output: "item = '\"' ;"
      },
      { goal: "non-terminals", input: "item=foo;", output: "item = foo ;" },
      { goal: "sequences", input: "item=a,b;", output: "item = a , b ;" },
      { goal: "choices", input: "item=a|b;", output: "item = a | b ;" },
      { goal: "groups", input: "item= (a|b);", output: "item = ( a | b ) ;" },
      {
        goal: "repetitions",
        input: "item=a,{b};",
        output: "item = a , { b } ;"
      },
      {
        goal: "fixed repetitions",
        input: "item=4*a;",
        output: "item = 4 * a ;"
      },
      {
        goal: "terminal exclusion",
        input: 'item=foo-"a";',
        output: 'item = foo - "a" ;'
      },
      {
        goal: "non-terminal exclusion",
        input: "item=foo-bar;",
        output: "item = foo - bar ;"
      },
      {
        goal: "document comment",
        input: "(* hello there! *)\n\n(* how are you? *)",
        output: "(* hello there! *)\n(* how are you? *)"
      },
      {
        goal: "element comment",
        input: "foo=bar(*really!*);",
        output: "foo = bar (*really!*) ;"
      },
      {
        goal: "element comment before optional",
        input: "foo=bar,(*really!*)[special];",
        output: "foo = bar , (*really!*) [ special ] ;"
      },
      {
        goal: "primary iso characters",
        input: "hello = a / b, (: c :), (/ d /) ! e .",
        output: "hello = a | b , { c } , [ d ] | e ;"
      }
    ].forEach(({ goal, input, output }) => {
      it(`can print ${goal}`, () => {
        const ast = parseEbnf(input);
        const printed = print(ast);
        expect(printed).to.eql(output);
      });
    });
  });

  describe("formatted text mode", () => {
    describe("choice lists", () => {
      it("does not convert a root choice list to a multiline statement, when 2 short items", () => {
        const text = "statement = function call | if condition;";
        const ast = parseEbnf(text);
        const result = printFormatted(ast);
        expect(result).to.eql("statement = function call | if condition ;");
      });

      it("converts a root choice list to a multiline statement, when 2 long items", () => {
        const text =
          'time calculation = time value , "-" , duration value | time value , "+" , duration value;';
        const ast = parseEbnf(text);
        const result = printFormatted(ast);
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
        const ast = parseEbnf(text);
        const result = printFormatted(ast);
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
        const ast = parseEbnf(text);
        const result = printFormatted(ast);
        expect(result).to.eql(
          "statement\n" +
            "  = a | b | cd | e | f | ghi | jkl\n" +
            "  | m | n | o  | p | q | rs  | t\n" +
            "  ;"
        );
      });

      it("does not convert a repeater choice list to a multiline statement when short choices", () => {
        const text = "statement = a, { b | d | e | gh| j }, e;";
        const ast = parseEbnf(text);
        const result = printFormatted(ast);
        expect(result).to.eql("statement = a , { b | d | e | gh | j } , e ;");
      });

      it("converts a repeater choice list to a multiline statement", () => {
        const text =
          "statement = a, { b | having a few long options | e | gh| j }, e;";
        const ast = parseEbnf(text);
        const result = printFormatted(ast);
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
        const ast = parseEbnf(text);
        const result = printFormatted(ast);
        expect(result).to.eql(
          "statement = a , b , c , d , e , f , g , h , i , j ,\n" +
            "  k , l , m , n , o , p , q , r , s , t , uu , v , w ,\n" +
            "  q , y , z ;"
        );
      });

      it("takes into account item length", () => {
        const text =
          "stat = abcdef something very long,g,hijklm,n,o,p,q,r,s,t,uu,v,w,q,y,z;";
        const ast = parseEbnf(text);
        const result = printFormatted(ast);
        expect(result).to.eql(
          "stat = abcdef something very long , g , hijklm , n ,\n" +
            "  o , p , q , r , s , t , uu , v , w , q , y , z ;"
        );
        const rawResult = print(ast);
        expect(rawResult).to.eql(
          "stat = abcdef something very long , g , hijklm , n , o , p , q , r , s , t , uu , v , w , q , y , z ;"
        );
      });

      it("uses a margin to prevent wrapping short pieces at the end", () => {
        const text = 'gamut = "[" , gamut float , "," , gamut float , "]";';
        const ast = parseEbnf(text);
        const result = printFormatted(ast);
        expect(result).to.eql(
          'gamut = "[" , gamut float , "," , gamut float , "]" ;'
        );
      });

      it.skip("keeps stacking offset until linebreak", () => {
        const text =
          'function call with priority support = identifier , [ "!" ] ,\n' +
          ' "(" , [ argument value with mutators , { "," , argument value with mutators } ] , ")";';
        const ast = parseEbnf(text);
        const result = printFormatted(ast);
        expect(result).to.eql(
          "function call with priority support = identifier ,\n" +
            '  [ "!" ] , "(" , [ argument value with mutators ,\n' +
            '  { "," , argument value with mutators } ] , ")";'
        );
      });
    });
  });
});
