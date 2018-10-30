/* Parse and convert ebnf */

/* lexical grammar */
%lex
%%
\s+                      { /* skip whitespace */}
"(*"([^*]|"*"/[^)])*"*)" { return 'COMMENT'; }
[a-z][A-Za-z0-9 ]*       { return 'IDENTIFIER'; }
[0-9]+                   { return 'DIGIT'; }
"*"                      { return '*'; } // repetition
"="                      { return '='; } // declaration
";"                      { return ';'; } // end of statement
"."                      { return ';'; } // end of statement
","                      { return ','; } // sequence
"|"                      { return '|'; } // alternation
"-"                      { return '-'; } // exclusion
"{"                      { return '{'; } // zero or more
"}"                      { return '}'; }
"("                      { return '('; } // group
")"                      { return ')'; }
"["                      { return '['; } // optional
"]"                      { return ']'; }
\"[^"]+\"                { return 'STRING'; }
\'[^']+\'                { return 'STRING'; }
"?"[^\?]+"?"             { return 'SEQUENCE'; }
<<EOF>>                  { return 'EOF';}

/lex

/* operator associations and precedence */

%left '|'
%left ','
%left '*'

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
        { $$ = { identifier: $1.trim(), definition: $rhs }; }
    | comment
    ;

rhs
  : rhs "," rhs
      { $$ = $1.sequence ? { sequence: $1.sequence.concat($3) } : { sequence: [$1, $3] } }
  | rhs "|" rhs
      { $$ = $1.choice ? { choice: $1.choice.concat($3) } : { choice: [$1, $3] } }
  | "{" rhs "}"
      { $$ = { repetition: $2 } }
  | "(" rhs ")"
      { $$ = { group: $2 } }
  | "[" rhs "]"
      { $$ = { optional: $2 } }
  | DIGIT "*" rhs
      { $$ = { repetition: $3, amount: $1 } }
  | identifier
  | terminal
  | exception
  | specialSequence
  ;

exception
    : IDENTIFIER "-" IDENTIFIER
      { $$ = { include: $1.trim(), exceptNonTerminal: $3.trim() } }
    | IDENTIFIER "-" STRING
      { $$ = { include: $1.trim(), exceptTerminal: $3 } }
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

