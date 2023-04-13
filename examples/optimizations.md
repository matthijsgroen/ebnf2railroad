# Optimizations

This file will demonstrate all the diagram optimizations and markup.

## Markup

The markup will be written in markdown. _Why_?

- Markdown produces clean HTML
- Markdown works in plain text form in the EBNF comments
  - Its clean
  - And still structured
- It prevents breaking markup

Also, links to sites, like https://github.com/matthijsgroen/ebnf2railroad will
be converted into a clickable link.

### Text decoration

Text markup is also a **breeze**. Using asterisks and _underscores_ to place
emphasis.

Linking to a [EBNF declaration](#one-or-more) is also nice

> It nice if you spend a lot of time and effort on creating a DSL (Domain
> specific language). That if you formally specify it using EBNF, you get really
> good looking documentation for free!
>
> -- someone

#### Code examples

Small code examples can be embedded as well.

```
it(could("improve") && clarify()) {
  your = "syntax";
  // intentions
}
```

Tiny tidbits to clarify `terminals` like `null` or `undefined` can help greatly.

What would a document great as html format:

1. responsive design


    * to view on small screens as well.
    * and make no really long run on sentences that seem to last forever on
      really large screens, because that is really, really annoying to read.

2. clear nice readable text. (nice font!)
3. linking to different sections

## optimizations

```
           ╭╴optimized choices╶╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╮
           ╎          ╭╴choice with optional╶╮          ╎
╟┬─────────┼┬─────────┼───────┬─────┬────────┼─────────┬┼──────────┬╢
 │         ╎│         ╎       │╭───╮│        ╎         │╎          │
 │         ╎│         ╎       ├┤ a ├┤        ╎         │╎          │
 │         ╎│         ╎       │╰───╯│        ╎         │╎          │
 │         ╎│         ╎       │╭───╮│        ╎         │╎          │
 │         ╎│         ╎       ╰┤ b ├╯        ╎         │╎          │
 │         ╎│         ╎        ╰───╯         ╎         │╎          │
 │         ╎│         ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯         │╎          │
 │         ╎│     ╭╴nested choices with optional╶╮     │╎          │
 │         ╎├─────┼───────────┬─────┬────────────┼─────┤╎          │
 │         ╎│     ╎           │╭───╮│            ╎     │╎          │
 │         ╎│     ╎           ├┤ a ├┤            ╎     │╎          │
 │         ╎│     ╎           │╰───╯│            ╎     │╎          │
 │         ╎│     ╎           │╭───╮│            ╎     │╎          │
 │         ╎│     ╎           ├┤ b ├┤            ╎     │╎          │
 │         ╎│     ╎           │╰───╯│            ╎     │╎          │
 │         ╎│     ╎           │╭───╮│            ╎     │╎          │
 │         ╎│     ╎           ╰┤ c ├╯            ╎     │╎          │
 │         ╎│     ╎            ╰───╯             ╎     │╎          │
 │         ╎│     ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯     │╎          │
 │         ╎│╭╴nested choices with multiple optionals╶╮│╎          │
 │         ╎├┼────────────────┬─────┬─────────────────┼┤╎          │
 │         ╎│╎                │╭───╮│                 ╎│╎          │
 │         ╎│╎                ├┤ a ├┤                 ╎│╎          │
 │         ╎│╎                │╰───╯│                 ╎│╎          │
 │         ╎│╎                │╭───╮│                 ╎│╎          │
 │         ╎│╎                ├┤ b ├┤                 ╎│╎          │
 │         ╎│╎                │╰───╯│                 ╎│╎          │
 │         ╎│╎                │╭───╮│                 ╎│╎          │
 │         ╎│╎                ├┤ c ├┤                 ╎│╎          │
 │         ╎│╎                │╰───╯│                 ╎│╎          │
 │         ╎│╎                │╭───╮│                 ╎│╎          │
 │         ╎│╎                ├┤ d ├┤                 ╎│╎          │
 │         ╎│╎                │╰───╯│                 ╎│╎          │
 │         ╎│╎                │╭───╮│                 ╎│╎          │
 │         ╎│╎                ╰┤ e ├╯                 ╎│╎          │
 │         ╎│╎                 ╰───╯                  ╎│╎          │
 │         ╎│╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯│╎          │
 │         ╎│            ╭╴nested choices╶╮            │╎          │
 │         ╎│            ╎     ╭───╮      ╎            │╎          │
 │         ╎├────────────┼────┬┤ a ├┬─────┼────────────┤╎          │
 │         ╎│            ╎    │╰───╯│     ╎            │╎          │
 │         ╎│            ╎    │╭───╮│     ╎            │╎          │
 │         ╎│            ╎    ├┤ b ├┤     ╎            │╎          │
 │         ╎│            ╎    │╰───╯│     ╎            │╎          │
 │         ╎│            ╎    │╭───╮│     ╎            │╎          │
 │         ╎│            ╎    ╰┤ c ├╯     ╎            │╎          │
 │         ╎│            ╎     ╰───╯      ╎            │╎          │
 │         ╎│            ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯            │╎          │
 │         ╎│       ╭╴choice with one or more╶╮        │╎          │
 │         ╎╰───────┼────────┬───────┬────────┼────────╯╎          │
 │         ╎        ╎        │ ╭───╮ │        ╎         ╎          │
 │         ╎        ╎        ├─┤ a ├─┤        ╎         ╎          │
 │         ╎        ╎        │ ╰───╯ │        ╎         ╎          │
 │         ╎        ╎        │ ╭───╮ │        ╎         ╎          │
 │         ╎        ╎        ╰┬┤ b ├┬╯        ╎         ╎          │
 │         ╎        ╎         │╰───╯│         ╎         ╎          │
 │         ╎        ╎         ╰──←──╯         ╎         ╎          │
 │         ╎        ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯         ╎          │
 │         ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯          │
 │╭╴optimized one or more╶╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╮│
 │╎                  ┏━━━━━━━━━━━━━━━━━━━━━━━━━┓                  ╎│
 ╰┼┬─────────────────┨ choice with one or more ┠─────────────────┬┼╯
  ╎│                 ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛                 │╎
  ╎│                       ╭╴one or more╶╮                       │╎
  ╎│                       ╎    ╭───╮    ╎                       │╎
  ╎├───────────────────────┼───┬┤ a ├┬───┼───────────────────────┤╎
  ╎│                       ╎   │╰───╯│   ╎                       │╎
  ╎│                       ╎   ╰──←──╯   ╎                       │╎
  ╎│                       ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╯                       │╎
  ╎│                 ╭╴one or more with group╶╮                  │╎
  ╎│                 ╎         ╭───╮          ╎                  │╎
  ╎├─────────────────┼───────┬┬┤ a ├┬┬────────┼──────────────────┤╎
  ╎│                 ╎       ││╰───╯││        ╎                  │╎
  ╎│                 ╎       ││╭───╮││        ╎                  │╎
  ╎│                 ╎       │╰┤ b ├╯│        ╎                  │╎
  ╎│                 ╎       │ ╰───╯ │        ╎                  │╎
  ╎│                 ╎       ╰───←───╯        ╎                  │╎
  ╎│                 ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯                  │╎
  ╎│ ╭╴one or more with repeater╶╮ ╭╴optimizations╶╌╌╌╌╌╌╌╌╌╌╌╌╮ │╎
  ╎│ ╎ ╭───╮     ╭───╮ ╭───╮     ╎ ╎   ┏━━━━━━━━━━━━━━━━━━━┓   ╎ │╎
  ╎╰─┼─┤ a ├─┬───┤ b ├─┤ c ├───┬─┼─┼┬──┨ optimized choices ┠──┬┼─╯╎
  ╎  ╎ ╰───╯ │   ╰───╯ ╰───╯   │ ╎ ╎│  ┗━━━━━━━━━━━━━━━━━━━┛  │╎  ╎
  ╎  ╎       │  ╭───╮ ╭───╮    │ ╎ ╎│┏━━━━━━━━━━━━━━━━━━━━━━━┓│╎  ╎
  ╎  ╎       ╰──┤ e ├─┤ d ├──←─╯ ╎ ╎╰┨ optimized one or more ┠╯╎  ╎
  ╎  ╎          ╰───╯ ╰───╯      ╎ ╎ ┗━━━━━━━━━━━━━━━━━━━━━━━┛ ╎  ╎
  ╎  ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯ ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯  ╎
  ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯
```

Text:

```ebnf
optimizations
  = optimized choices
  | optimized one or more
  ;
```

## Optimization: Removal of duplicate choices

original fragment:

```
optimizations
  = optimized choices
  | optimized one or more
  | (optimized one or more)
  | optimized one or more;
```

## optimized choices

```
           ┏━━━━━━━━━━━━━━━━━━━━━━┓
╟┬─────────┨ choice with optional ┠─────────┬╢
 │         ┗━━━━━━━━━━━━━━━━━━━━━━┛         │
 │     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓     │
 ├─────┨ nested choices with optional ┠─────┤
 │     ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛     │
 │┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓│
 ├┨ nested choices with multiple optionals ┠┤
 │┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛│
 │            ┏━━━━━━━━━━━━━━━━┓            │
 ├────────────┨ nested choices ┠────────────┤
 │            ┗━━━━━━━━━━━━━━━━┛            │
 │       ┏━━━━━━━━━━━━━━━━━━━━━━━━━┓        │
 ╰───────┨ choice with one or more ┠────────╯
         ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

Text:

```ebnf
optimized choices
  = choice with optional
  | nested choices with optional
  | nested choices with multiple optionals
  | nested choices
  | choice with one or more
  ;
```

## optimized one or more

```
             ┏━━━━━━━━━━━━━━━━━━━━━━━━━┓
╟┬───────────┨ choice with one or more ┠───────────┬╢
 │           ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛           │
 │                 ┏━━━━━━━━━━━━━┓                 │
 ├─────────────────┨ one or more ┠─────────────────┤
 │                 ┗━━━━━━━━━━━━━┛                 │
 │           ┏━━━━━━━━━━━━━━━━━━━━━━━━┓            │
 ├───────────┨ one or more with group ┠────────────┤
 │           ┗━━━━━━━━━━━━━━━━━━━━━━━━┛            │
 │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ┏━━━━━━━━━━━━━━━┓ │
 ╰─┨ one or more with repeater ┠─┨ optimizations ┠─╯
   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┗━━━━━━━━━━━━━━━┛
```

Text:

```ebnf
optimized one or more
  = choice with one or more
  | one or more
  | one or more with group
  | one or more with repeater , optimizations
  ;
```

## choice with optional

```
┠┬─────┬┨
 │╭───╮│
 ├┤ a ├┤
 │╰───╯│
 │╭───╮│
 ╰┤ b ├╯
  ╰───╯
```

Text:

```ebnf
choice with optional = [ "a" | "b" ] ;
```

## nested choices with optional

```
┠┬─────┬┨
 │╭───╮│
 ├┤ a ├┤
 │╰───╯│
 │╭───╮│
 ├┤ b ├┤
 │╰───╯│
 │╭───╮│
 ╰┤ c ├╯
  ╰───╯
```

Text:

```ebnf
nested choices with optional = [ "a" | "b" | "c" ] ;
```

## Optimization: Rewrite to simplify optional paths

If a choice has an optional path rewrite so that it is more clear that the
entire choice can be skipped.

original fragment:

```
nested choices with optional = "a" | [ "b" | [ "c" ] ];
```

## nested choices with multiple optionals

```
┠┬─────┬┨
 │╭───╮│
 ├┤ a ├┤
 │╰───╯│
 │╭───╮│
 ├┤ b ├┤
 │╰───╯│
 │╭───╮│
 ├┤ c ├┤
 │╰───╯│
 │╭───╮│
 ├┤ d ├┤
 │╰───╯│
 │╭───╮│
 ╰┤ e ├╯
  ╰───╯
```

Text:

```ebnf
nested choices with multiple optionals = [ "a" | "b" | "c" | "d" | "e" ] ;
```

original fragment:

```
nested choices with multiple optionals = "a" | [ "b" | "c"] | [ "d" | "e" ];
```

## nested choices

```
  ╭───╮
┠┬┤ a ├┬┨
 │╰───╯│
 │╭───╮│
 ├┤ b ├┤
 │╰───╯│
 │╭───╮│
 ╰┤ c ├╯
  ╰───╯
```

Text:

```ebnf
nested choices = "a" | "b" | "c" ;
```

## Optimization: Ungrouping

If a structure can be ungrouped without changing the meaning, ungroup it.

original fragment:

```
nested choices = "a" | ( "b" | "c" );
```

## duplicate choices

```
  ╭───╮
┠┬┤ a ├┬┨
 │╰───╯│
 │╭───╮│
 ├┤ b ├┤
 │╰───╯│
 │╭───╮│
 ╰┤ c ├╯
  ╰───╯
```

Text:

```ebnf
duplicate choices = "a" | "b" | "c" ;
```

## Optimization: Ungrouping

If a structure can be ungrouped without changing the meaning, ungroup it.

original fragment:

```
duplicate choices = "a" | ( "b" | "c" | "a" ) | "b";
```

## choice with one or more

```
┠┬───────┬┨
 │ ╭───╮ │
 ├─┤ a ├─┤
 │ ╰───╯ │
 │ ╭───╮ │
 ╰┬┤ b ├┬╯
  │╰───╯│
  ╰──←──╯
```

Text:

```ebnf
choice with one or more = "a" | { "b" } ;
```

## one or more

```
  ╭───╮
┠┬┤ a ├┬┨
 │╰───╯│
 ╰──←──╯
```

Text:

```ebnf
one or more = { "a" }- ;
```

## Optimization: Simplify one-or-more syntax

original fragment:

```
one or more = "a", { "a" };
```

## one or more with group

```
   ╭───╮
┠┬┬┤ a ├┬┬┨
 ││╰───╯││
 ││╭───╮││
 │╰┤ b ├╯│
 │ ╰───╯ │
 ╰───←───╯
```

Text:

```ebnf
one or more with group = { "a" | "b" }- ;
```

## one or more with repeater

```
  ╭───╮     ╭───╮ ╭───╮
┠─┤ a ├─┬───┤ b ├─┤ c ├───┬─┨
  ╰───╯ │   ╰───╯ ╰───╯   │
        │  ╭───╮ ╭───╮    │
        ╰──┤ e ├─┤ d ├──←─╯
           ╰───╯ ╰───╯
```

Text:

```ebnf
one or more with repeater = "a" , "b" , "c", { "e" , "d" , "b" , "c" } ;
```

## optional repeater

```
 ╭───────────────╮
 │  ╭───╮ ╭───╮  │
┠┴┬─┤ a ├─┤ b ├─┬┴┨
  │ ╰───╯ ╰───╯ │
  ╰──────←──────╯
```

Text:

```ebnf
optional repeater = { "a" , "b" } ;
```

## Optimization: Remove duplicate optional routes

If a repetation is optional, but also wrap inside an optional, remove the
optional

original fragment:

```
optional repeater = [ { "a", "b" } ];
```

## optional optional

```
 ╭──────→──────╮
 │ ╭───╮ ╭───╮ │
┠┴─┤ a ├─┤ b ├─┴┨
   ╰───╯ ╰───╯
```

Text:

```ebnf
optional optional = [ "a" , "b" ] ;
```

original fragment:

```
optional optional = [ [ "a", "b" ] ];
```

## calculation

```
   ╭╴normal value╶╮          ╭╴number value╶╮
   ╎╭────────────╮╎    ╭───╮ ╎╭────────────╮╎
╟┬─┼┤ fixing ref ├┼─┬──┤ * ├─┼┤ fixing ref ├┼──┬─┬╢
 │ ╎╰────────────╯╎ │  ╰───╯ ╎╰────────────╯╎  │ │
 │ ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯ │        ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯  │ │
 │                  │  ╭───╮  ┏━━━━━━━━━━━━━━┓ │ │
 │                  ╰─┬┤ + ├┬─┨ normal value ┠─╯ │
 │                    │╰───╯│ ┗━━━━━━━━━━━━━━┛   │
 │                    │╭───╮│                    │
 │                    ╰┤ - ├╯                    │
 │                     ╰───╯                     │
 │   ╭╴special value╶╮                           │
 │   ╎╭────────────╮ ╎ ╭───╮ ┏━━━━━━━━━━━━━━━┓   │
 ╰───┼┤ fixing ref ├─┼─┤ - ├─┨ special value ┠───╯
     ╎╰────────────╯ ╎ ╰───╯ ┗━━━━━━━━━━━━━━━┛
     ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯
```

Text:

```ebnf
calculation
  = normal value , "*" , number value
  | normal value , "+" , normal value
  | normal value , "-" , normal value
  | special value , "-" , special value
  ;
```

## normal value

```
 ╭────────────╮
┠┤ fixing ref ├┨
 ╰────────────╯
```

Text:

```ebnf
normal value = "fixing ref" ;
```

## special value

```
 ╭────────────╮
┠┤ fixing ref ├┨
 ╰────────────╯
```

Text:

```ebnf
special value = "fixing ref" ;
```

## number value

```
 ╭────────────╮
┠┤ fixing ref ├┨
 ╰────────────╯
```

Text:

```ebnf
number value = "fixing ref" ;
```

# Mixing comments in

## comments

```
           ╭╴comment in choice with optional╶╮
╟┬─────────┼──────┬───────────────────┬──────┼─────────┬╢
 │         ╎      │       ╭───╮       │      ╎         │
 │         ╎      ├───────┤ a ├───────┤      ╎         │
 │         ╎      │       ╰───╯       │      ╎         │
 │         ╎      │ ╭───╮   comment   │      ╎         │
 │         ╎      ╰─┤ b ├─────────────╯      ╎         │
 │         ╎        ╰───╯                    ╎         │
 │         ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯         │
 │          ╭╴comment in one or more before╶╮          │
 │          ╎                    ╭───────╮  ╎          │
 │          ╎  ╭───╮   comment   │ ╭───╮ │  ╎          │
 ├──────────┼──┤ a ├─────────────┴┬┤ a ├┬┴──┼──────────┤
 │          ╎  ╰───╯              │╰───╯│   ╎          │
 │          ╎                     ╰──←──╯   ╎          │
 │          ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯          │
 │          ╭╴comment_in_one_or_more_in╶╌╌╌╌╮          │
 │          ╎       ╭─────────────────────╮ ╎          │
 │          ╎ ╭───╮ │  ╭───╮   comment    │ ╎          │
 ├──────────┼─┤ a ├─┴┬─┤ a ├─────────────┬┴─┼──────────┤
 │          ╎ ╰───╯  │ ╰───╯             │  ╎          │
 │          ╎        ╰─────────←─────────╯  ╎          │
 │          ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯          │
 │          ╭╴comment in one or more after╶╮           │
 │          ╎      ╭───╮    comment        ╎           │
 ├──────────┼─────┬┤ a ├┬──────────────────┼───────────┤
 │          ╎     │╰───╯│                  ╎           │
 │          ╎     ╰──←──╯                  ╎           │
 │          ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯           │
 │╭╴comment in one or more with repeater╶╌╌╌╌╌╌╌╌╌╌╌╌╌╮│
 │╎ ╭───╮ ╭───╮   comment             ╭───╮           ╎│
 ├┼─┤ a ├─┤ b ├─────────────┬─────────┤ c ├─────────┬─┼┤
 │╎ ╰───╯ ╰───╯             │         ╰───╯         │ ╎│
 │╎                         │  ╭───╮ ╭───╮ ╭───╮    │ ╎│
 │╎                         ╰──┤ b ├─┤ e ├─┤ d ├──←─╯ ╎│
 │╎                            ╰───╯ ╰───╯ ╰───╯      ╎│
 │╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯│
 │╭╴comment in nested choices with multiple optionals╶╮│
 ├┼───────┬───────────────────────────────────┬───────┼┤
 │╎       │               ╭───╮               │       ╎│
 │╎       ├───────────────┤ a ├───────────────┤       ╎│
 │╎       │               ╰───╯               │       ╎│
 │╎       │                         comment   │       ╎│
 │╎       ├─┬───────────────────┬─────────────┤       ╎│
 │╎       │ │ ╭───╮   comment   │             │       ╎│
 │╎       │ ├─┤ b ├─────────────┤             │       ╎│
 │╎       │ │ ╰───╯             │             │       ╎│
 │╎       │ │       ╭───╮       │             │       ╎│
 │╎       │ ╰───────┤ c ├───────╯             │       ╎│
 │╎       │         ╰───╯                     │       ╎│
 │╎       │               ╭───╮               │       ╎│
 │╎       ├───────────────┤ d ├───────────────┤       ╎│
 │╎       │               ╰───╯               │       ╎│
 │╎       │               ╭───╮               │       ╎│
 │╎       ╰───────────────┤ e ├───────────────╯       ╎│
 │╎                       ╰───╯                       ╎│
 │╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯│
 │   ╭╴comment in one or more with repeater after╶╮    │
 │   ╎   ╭───╮     ╭───╮ ╭───╮       comment      ╎    │
 ├───┼───┤ a ├─┬───┤ b ├─┤ c ├───┬────────────────┼────┤
 │   ╎   ╰───╯ │   ╰───╯ ╰───╯   │                ╎    │
 │   ╎         │  ╭───╮ ╭───╮    │                ╎    │
 │   ╎         ╰──┤ e ├─┤ d ├──←─╯                ╎    │
 │   ╎            ╰───╯ ╰───╯                     ╎    │
 │   ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯    │
 │        ╭╴comment before optional╶╌╌╌╌╌╌╌╌╌╌╮        │
 │        ╎ ╭───╮           comment           ╎        │
 ╰────────┼─┤ a ├─┬─────────────────────────┬─┼────────╯
          ╎ ╰───╯ │ ╭───╮ ╭───╮ ╭───╮ ╭───╮ │ ╎
          ╎       ╰─┤ d ├─┤ e ├─┤ b ├─┤ c ├─╯ ╎
          ╎         ╰───╯ ╰───╯ ╰───╯ ╰───╯   ╎
          ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯
```

Text:

```ebnf
comments
  = comment in choice with optional
  | comment in one or more before
  | comment_in_one_or_more_in
  | comment in one or more after
  | comment in one or more with repeater
  | comment in nested choices with multiple optionals
  | comment in one or more with repeater after
  | comment before optional
  ;
```

## comment in choice with optional

```
┠┬───────────────────┬┨
 │       ╭───╮       │
 ├───────┤ a ├───────┤
 │       ╰───╯       │
 │ ╭───╮   comment   │
 ╰─┤ b ├─────────────╯
   ╰───╯
```

Text:

```ebnf
comment in choice with optional = [ "a" | "b" (* comment *) ] ;
```

## comment in one or more before

```
                    ╭───────╮
  ╭───╮   comment   │ ╭───╮ │
┠─┤ a ├─────────────┴┬┤ a ├┬┴─┨
  ╰───╯              │╰───╯│
                     ╰──←──╯
```

Text:

```ebnf
comment in one or more before = "a" , (* comment *) , { "a" } ;
```

## comment_in_one_or_more_in

```
        ╭─────────────────────╮
  ╭───╮ │  ╭───╮   comment    │
┠─┤ a ├─┴┬─┤ a ├─────────────┬┴─┨
  ╰───╯  │ ╰───╯             │
         ╰─────────←─────────╯
```

Text:

```ebnf
comment_in_one_or_more_in = "a" , { "a" (* comment *) } ;
```

## comment in one or more after

```
   ╭───╮    comment
┠─┬┤ a ├┬─────────────┨
  │╰───╯│
  ╰──←──╯
```

Text:

```ebnf
comment in one or more after = { "a" }- ,
  (* comment *) ;
```

## comment in one or more with repeater

```
  ╭───╮ ╭───╮   comment             ╭───╮
┠─┤ a ├─┤ b ├─────────────┬─────────┤ c ├─────────┬─┨
  ╰───╯ ╰───╯             │         ╰───╯         │
                          │  ╭───╮ ╭───╮ ╭───╮    │
                          ╰──┤ b ├─┤ e ├─┤ d ├──←─╯
                             ╰───╯ ╰───╯ ╰───╯
```

Text:

```ebnf
comment in one or more with repeater = "a" , "b" ,
  (* comment *) , "c", { "b" , "e" , "d" , "c" } ;
```

## comment before optional

```
  ╭───╮           comment
┠─┤ a ├─┬─────────────────────────┬─┨
  ╰───╯ │ ╭───╮ ╭───╮ ╭───╮ ╭───╮ │
        ╰─┤ d ├─┤ e ├─┤ b ├─┤ c ├─╯
          ╰───╯ ╰───╯ ╰───╯ ╰───╯
```

Text:

```ebnf
comment before optional = "a" , (* comment *) [ "d" , "e" , "b" , "c" ] ;
```

## comment in nested choices with multiple optionals

```
┠┬───────────────────────────────────┬┨
 │               ╭───╮               │
 ├───────────────┤ a ├───────────────┤
 │               ╰───╯               │
 │                         comment   │
 ├─┬───────────────────┬─────────────┤
 │ │ ╭───╮   comment   │             │
 │ ├─┤ b ├─────────────┤             │
 │ │ ╰───╯             │             │
 │ │       ╭───╮       │             │
 │ ╰───────┤ c ├───────╯             │
 │         ╰───╯                     │
 │               ╭───╮               │
 ├───────────────┤ d ├───────────────┤
 │               ╰───╯               │
 │               ╭───╮               │
 ╰───────────────┤ e ├───────────────╯
                 ╰───╯
```

Text:

```ebnf
comment in nested choices with multiple optionals =
  [ "a"
  | [ "b" (* comment *) | "c" ] (* comment *)
  | "d"
  | "e"
  ] ;
```

## comment in one or more with repeater after

```
  ╭───╮     ╭───╮ ╭───╮       comment
┠─┤ a ├─┬───┤ b ├─┤ c ├───┬─────────────┨
  ╰───╯ │   ╰───╯ ╰───╯   │
        │  ╭───╮ ╭───╮    │
        ╰──┤ e ├─┤ d ├──←─╯
           ╰───╯ ╰───╯
```

Text:

```ebnf
comment in one or more with repeater after = "a" ,
  "b" , "c", { "e" , "d" , "b" , "c" } , (* comment *) ;
```

# html dangerous content

## html

```
  ╭─────────────────────────╮   <h1> can be everywhere </h1>
┠─┤ <h1>Danger & Risks</h1> ├──────────────────────────────────┨
  ╰─────────────────────────╯
```

Text:

```ebnf
html = "<h1>Danger & Risks</h1>" (* <h1> can be everywhere </h1> *) ;
```

## simple syntax

```
        ╭╴reference╶╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╮
        ╎                           ╭╴big parts╶╮ ╎
  ╭───╮ ╎ ╭───────╮ ┏━━━━━━━━━━━━━┓ ╎ ╭──────╮  ╎ ╎ ╭───╮
╟─┤ a ├─┼─┤ using ├─┨ small parts ┠─┼┬┤ item ├┬─┼─┼─┤ b ├─╢
  ╰───╯ ╎ ╰───────╯ ┗━━━━━━━━━━━━━┛ ╎│╰──────╯│ ╎ ╎ ╰───╯
        ╎                           ╎╰────←───╯ ╎ ╎
        ╎                           ╰╌╌╌╌╌╌╌╌╌╌╌╯ ╎
        ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯
```

Text:

```ebnf
simple syntax = "a" , reference , "b" ;
```

## reference

```
  ╭───────╮ ┏━━━━━━━━━━━━━┓ ┏━━━━━━━━━━━┓
╟─┤ using ├─┨ small parts ┠─┨ big parts ┠─╢
  ╰───────╯ ┗━━━━━━━━━━━━━┛ ┗━━━━━━━━━━━┛
```

Text:

```ebnf
reference = "using" , small parts , big parts ;
```

## small parts

```
  ╭──────────╮
┠┬┤ terminal ├┬┨
 │╰──────────╯│
 │ ╭───────╮  │
 ╰─┤ other ├──╯
   ╰───────╯
```

Text:

```ebnf
small parts = "terminal" | "other" ;
```

## big parts

```
  ╭──────╮
┠┬┤ item ├┬┨
 │╰──────╯│
 ╰────←───╯
```

Text:

```ebnf
big parts = { "item" }- ;
```

# Altenative ISO characters

## definition main characters

```
              ╭──────╮
┠┬────────────┤ item ├─────────────┬┨
 │            ╰──────╯             │
 │            ╭───────╮            │
 ├────────────┤ item2 ├────────────┤
 │            ╰───────╯            │
 │ ╭─────→──────╮ ╭──────────────╮ │
 │ │╭──────────╮│ │ ╭──────────╮ │ │
 ╰─┴┤ optional ├┴─┴┬┤ repeater ├┬┴─╯
    ╰──────────╯   │╰──────────╯│
                   ╰──────←─────╯
```

Text:

```ebnf
definition main characters
  = "item"
  | "item2"
  | [ "optional" ] , { "repeater" }
  ;
```

Original fragment:

```
definition main characters = "item" | "item2" | ["optional"], { "repeater" };
```

## alternative main characters

```
              ╭──────╮
┠┬────────────┤ item ├─────────────┬┨
 │            ╰──────╯             │
 │            ╭───────╮            │
 ├────────────┤ item2 ├────────────┤
 │            ╰───────╯            │
 │ ╭─────→──────╮ ╭──────────────╮ │
 │ │╭──────────╮│ │ ╭──────────╮ │ │
 ╰─┴┤ optional ├┴─┴┬┤ repeater ├┬┴─╯
    ╰──────────╯   │╰──────────╯│
                   ╰──────←─────╯
```

Text:

```ebnf
alternative main characters
  = "item"
  | "item2"
  | [ "optional" ] , { "repeater" }
  ;
```

Original fragment:

```
alternative main characters = "item" / "item2" ! (/ "optional" /), (:  "repeater" :).
```

## lowercase letter

```
 ╭───────────┬──────────╮
 │  ╭───╮    │  ╭───╮   │╭───╮
┠┴┬─┤ a ├──┬╮╰┬─┤ n ├─┬╮╰┤ z ├┬┨
  │ ╰───╯  ││ │ ╰───╯ ││ ╰───╯│
  │ ╭───╮  ││ │ ╭───╮ ││      │
  ├─┤ b ├──┤│ ├─┤ o ├─┤│      │
  │ ╰───╯  ││ │ ╰───╯ ││      │
  │ ╭───╮  ││ │╭─────╮││      │
  ├─┤ c ├──┤│ ├┤ pqr ├┤│      │
  │ ╰───╯  ││ │╰─────╯││      │
  │ ╭───╮  ││ │ ╭───╮ ││      │
  ├─┤ d ├──┤│ ├─┤ s ├─┤│      │
  │ ╰───╯  ││ │ ╰───╯ ││      │
  │ ╭───╮  ││ │ ╭───╮ ││      │
  ├─┤ e ├──┤│ ├─┤ t ├─┤│      │
  │ ╰───╯  ││ │ ╰───╯ ││      │
  │ ╭───╮  ││ │ ╭───╮ ││      │
  ├─┤ f ├──┤│ ├─┤ u ├─┤│      │
  │ ╰───╯  ││ │ ╰───╯ ││      │
  │╭──────╮││ │ ╭───╮ ││      │
  ├┤ ghij ├┤│ ├─┤ v ├─┤│      │
  │╰──────╯││ │ ╰───╯ ││      │
  │ ╭───╮  ││ │ ╭───╮ ││      │
  ├─┤ k ├──┤│ ├─┤ w ├─┤│      │
  │ ╰───╯  ││ │ ╰───╯ ││      │
  │ ╭───╮  ││ │ ╭───╮ ││      │
  ├─┤ l ├──┤│ ├─┤ x ├─┤│      │
  │ ╰───╯  ││ │ ╰───╯ ││      │
  │ ╭───╮  ││ │ ╭───╮ ││      │
  ╰─┤ m ├──╯│ ╰─┤ y ├─╯│      │
    ╰───╯   │   ╰───╯  │      │
            ╰──────────┴──────╯
```

Text:

```ebnf
lowercase letter
  = "a" | "b"    | "c"   | "d" | "e"
  | "f" | "ghij" | "k"   | "l" | "m"
  | "n" | "o"    | "pqr" | "s" | "t"
  | "u" | "v"    | "w"   | "x" | "y"
  | "z"
  ;
```
