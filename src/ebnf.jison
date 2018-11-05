/* Parse and convert ebnf */

/* lexical grammar */
%lex
%%
\s+                      { /* skip whitespace */}
"(*"([^*]|"*"/[^)])*"*)" { return 'COMMENT'; }
[a-z][A-Za-z0-9 ]*       { return 'IDENTIFIER'; }
[0-9]+                   { return 'DIGIT'; }
"(/"                     { return '['; } // alternative start-option-symbol
"/)"                     { return ']'; } // alternative end-option-symbol
"(:"                     { return '{'; } // alternative start-repeat-symbol
":)"                     { return '}'; } // alternative end-repeat-symbol

"*"                      { return '*'; } // repetition
"="                      { return '='; } // declaration
";"                      { return ';'; } // terminator-symbol
"."                      { return ';'; } // alternative terminator-symbol
","                      { return ','; } // concatenate-symbol
"|"                      { return '|'; } // definition-seperator-symbol
"/"                      { return '|'; } // alternative definition-seperator-symbol
"!"                      { return '|'; } // alternative definition-seperator-symbol
"-"                      { return '-'; } // exclusion
"{"                      { return '{'; } // zero or more
"}"                      { return '}'; }
"("                      { return '('; } // start-group-symbol
")"                      { return ')'; } // end-group-symbol
"["                      { return '['; } // start-option-symbol
"]"                      { return ']'; } // end-option-symbol
\"[^"]+\"                { return 'STRING'; }
\'[^']+\'                { return 'STRING'; }
"?"[^\?]+"?"             { return 'SEQUENCE'; }
<<EOF>>                  { return 'EOF';}

/lex

/* operator associations and precedence */

%left '|'
%left ','
%left '*'
%left COMMENT

%start grammar

%% /* language grammar */

grammar
    : production_list EOF
        {return $1;}
    ;

production_list
    : production_list production
        { $$ = $production_list.concat($production); }
    | production
        { $$ = [$production] }
    ;

production
    : IDENTIFIER "=" rhs ";"
        { $$ = { identifier: $1.trim(), definition: $rhs, location: @1.first_line };  }
    | comment
    ;

rhs
  : rhs "," rhs
      { $$ = $1.sequence ? { sequence: $1.sequence.concat($3) } : { sequence: [$1, $3] } }
  | rhs "|" rhs
      { $$ = $1.choice ? { choice: $1.choice.concat($3) } : { choice: [$1, $3] } }
  | "{" rhs "}"
      { $$ = { repetition: $2, skippable: true } }
  | "(" rhs ")"
      { $$ = { group: $2 } }
  | "[" rhs "]"
      { $$ = { optional: $2 } }
  | DIGIT "*" rhs
      { $$ = { repetition: $3, amount: $1 } }
  | rhs comment
    { $$ = { ...$2, group: $1 } }
  | identifier
  | terminal
  | exception
  | specialSequence
  ;

exception
    : IDENTIFIER "-" IDENTIFIER
      { $$ = { include: $1.trim(), exceptNonTerminal: $3.trim() } }
    | IDENTIFIER "-" STRING
      { $$ = { include: $1.trim(), exceptTerminal: $3.slice(1, -1) } }
    ;

identifier
    : IDENTIFIER
        {$$ = { nonTerminal: $1.trim() }; }
    ;

specialSequence
    : SEQUENCE { $$ = { specialSequence: $1.slice(1, -1).trim() } }
    ;

terminal
    : STRING { $$ = { terminal: $1.slice(1, -1) } }
    ;

comment
    : COMMENT { $$ = {comment: $1.slice(2, -2) } }
    ;

