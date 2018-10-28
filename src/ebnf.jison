/* Parse and convert ebnf */

/* lexical grammar */
%lex
%%
\s+                   {/* skip whitespace */}
[a-z]+[A-Za-z0-9 ]*   {return 'IDENTIFIER'; }
"="                   {return '='; }
<<EOF>>               {return 'EOF';}

/lex

/* operator associations and precedence */

%start grammar

%% /* language grammar */

grammar
    : production_list EOF
        {return $1;}
    ;

production_list
    : production_list production { $$ = $production_list; $$.push($production); }
    | production                 { $$ = [$production] }
    ;

production
    : IDENTIFIER "="
        {$$ = { identifier: $1.trim() };}
    ;

