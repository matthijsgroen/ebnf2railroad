/* Parse and convert ebnf */

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
            definition: $rhs
          };
        %}
    ;

rhs
  : rhs "," rhs
      { $$ = $1.sequence ? { sequence: $1.sequence.concat($3) } : { sequence: [$1, $3] } }
  | rhs "|" rhs
      { $$ = $1.choice ? { choice: $1.choice.concat($3) } : { choice: [$1, $3] } }
  | identifier
  | terminal
  ;

identifier
    : IDENTIFIER
        {$$ = { nonTerminal: $1.trim() }; }
    ;

terminal
    : STRING { $$ = { terminal: $1.slice(1, -1) } }
    ;

