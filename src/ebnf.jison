/* Parse and convert ebnf */

%{
  const {
    Diagram,
    Sequence,
    Choice,
    // OneOrMore
    Terminal,
    NonTerminal
    // Skip
  } = require("railroad-diagrams");
%}

/* lexical grammar */
%lex
%%
\s+                   {/* skip whitespace */}
[a-z][A-Za-z0-9 ]*    {return 'IDENTIFIER'; }
"="                   {return '='; }
";"                   {return ';'; }
","                   {return ','; }
"|"                   {return '|'; }
\"[^"]+\"             {return 'STRING'; }
\'[^']+\'             {return 'STRING'; }
<<EOF>>               {return 'EOF';}

/lex

/* operator associations and precedence */

%left ','
%left '|'

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
        %{
          $$ = {
            identifier: $1.trim(),
            diagram: Diagram($rhs)
          };
        %}
    ;

rhs
  : rhs "," rhs
      { $$ = Sequence($1, $3) }
  | rhs "|" rhs
      { $$ = Choice(0, $1, $3) }
  | identifier
  | terminal
  ;

identifier
    : IDENTIFIER
        {$$ = NonTerminal($1.trim()); }
    ;

terminal
    : STRING { $$ = Terminal($1.slice(1, -1)) }
    ;

