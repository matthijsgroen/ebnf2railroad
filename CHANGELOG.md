# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.14.1] - 2023-04-13

### Fixed

- Fixed an issue where repeaters written back as text did not reverse repeater sequences. (`a, b, { c, d, a, b }` was turned into `a, b, { d, c, a, b }` in the output text version).

## [1.14.0] - 2023-04-13

### Added

- One ore more. Support for 'zero or more' with an empty exception. `{ a }-` which, according to section section 5.8 of [ISO/IEC 14977](https://www.cl.cam.ac.uk/~mgk25/iso-14977.pdf) means 'one or more'. Text using `( a , b ), { a, b }` will automatically be optimized to `{ a, b }-`

## [1.13.1] - 2023-02-19

### Fixes

- Fix height calculation of 'Choice' element. (Had to take over element from `railroad-diagrams` package)

## [1.13.0] - 2020-10-24

### Added

- Support for markdown output, by using a `.md` extension on the target filename

### Fixes

- Only remove optional around repetition if repetition is zero or more

## [1.12.0] - 2020-10-10

### Changes

- Deduplication of choices is improved. Now also works for text output, and can
  deduplicate items when one of them has a comment.

  ```
  a | a | a (* comment *) | b => a (* comment *) | b
  ```

- Improve height of overview diagrams
- Update color scheme of dark theme
- Improved styling of blockquotes in markdown `>`

### Fixes

- Exception when non-terminal lacks definition

## [1.11.1] - 2020-09-23

### Fixes

- Overview diagrams should also optimize its sub elements

## [1.11.0] - 2020-09-23

### Added

- Support for generation overview diagrams on root elements, skippable with
  `--no-overview-diagram`
- Support for optimizing source definition file using `--rewrite`
- Skip only diagram wrapping with `--no-diagram-wrap`
- Breaking of long elements over multiple lines in optional items `[]`
- Plain text will now also be optimized when reasonable: Text will not be
  optimized when using the `--no-optimizations` flag.

  ```
  [ [ a ] ] => [ a ]
  [ { a } ] => { a }
  a | b | [ c | [ d | e ] ] => [ a | b | c | d | e ]
  ```

- Support of detection of pure character sets. Character sets are now listed
  seperately at the bottom of the table of contents. A character sets is a
  choice of terminals, or a choice where the non-terminals are also character
  sets
- Support for comments before an optional, placing the comment on the skip line
  and make the skip line the main line
- Support for `_` (underscore) in identifiers

## Fixes

- When elements in choices are grouped, it will now maintain the original order
- Running out of memory for big documents

### Changed

- Show line underneath comments in railroad diagram

## [1.10.0] - 2020-09-16

### Added

- Support for `--dump-ast` and `--read-ast` options to allow external processing
- Support for identifiers starting with an uppercase letter
- Improved error reporting. Exceptions now contain a `data` element with the
  following:

  - `line` The line number of the error (starting from 1)
  - `pos` The position within the line of the error (starting from 1)
  - `expected` the types of token expected by the parser (array)
  - `token` the token received by the parser

- Optimisation to prevent double skip lines

### Security

- Updated dependencies to solve security vulnerabilities

### Fixed

- Display of proper line number in CLI output

## [1.9.0] - 2019-01-22

### Fixed

- Improved detection for recursion and roots

## [1.8.2] - 2019-01-21

### Changed

- Updated example outputs

### Fixed

- Optimization issue in choice length

## [1.8.1] - 2019-01-21

### Changed

- Skip all optimizations with `--no-optimizations`

## [1.8.0] - 2018-11-26

### Added

- Dark and light color theme

## [1.7.0] - 2018-11-22

### Added

- Syntax diagram will wrap if sequences become very long
- Split navigation bar in 3 parts. Root elements, Normal elements, Common
  elements
- Added Marker of recursion in navigation list
- Responsive design, mobile navigation, overall styling

### Fixed

- Small pretty print issues that caused weird line breaks

## [1.6.0] - 2018-11-13

### Added

- Formatting of text output in the document
- Long sequences will wrap over multiple lines
- Choice lists between 3 and 6 items will be displayed under eachother
- Choice lists over 6 items will be displayed as a grid
- Option `--no-text-formatting` to write all text on a single line
- Option `--no-optimizations` to write diagrams as-is
- Option `--no-target` to skip writing documentation
- Option `--write-style` to 'prettify' source documents

## [1.5.0] - 2018-11-10

### Added

- Support to use package as library within other projects
- Support for alternative characters: `|` -> `/`, `!`, `[ ]` -> `(/ /)`, `{ }`
  -> `(: :)`
- Table of contents, showing structure in alphabet, or as hierarchy overview at
  the bottom.
- Optimize EBNF syntax as `a | a` into `a`
- Optimize EBNF syntax as `a | a, b` into `a, [ b ]`
- Optimize EBNF syntax as `a, b, c, g | a, b, d, g` into `a, b, ( c | d ), g`

### Fixed

- Closing tag for Terminals with single quotes
- Issue when the chain was optimized without repeater `a, b, c, { b, c }`.

## [1.4.0] - 2018-11-03

### Added

- Optimize EBNF syntax as `[ a | b ]` in diagram as single choice with
  integrated skip
- Optimize EBNF syntax as `[ a | ( b | c ) ]` in diagram as single choice
- Optimize EBNF syntax as `[ a | [ b | c ] ]` in diagram as single choice with
  integrated skip
- Demo file to demontrate markup and optimizations
- Auto linking plain links in comments
- HTML escaping in definition inline comments
- Syntax highlight in text presentation of EBNF
- Improved 'breaking' of EBNF over multiple lines

### Fixed

- Issue with optimizer in repeating elements `a, b, c, { d, b, c }`. the
  repetition showed `c, b` instead of `b, c`

## [1.3.0] - 2018-11-02

### Added

- Add support for comments within statements, that will be rendered within the
  diagram
- Option `--title` to add a title to the output document
- Show different start/end indicators if diagram is 'complex' (refers to other
  definitions)
- Better optimization of repeating elements. `a, b, c, { d, b, c }` will display
  `a` followed by a loop containing `b, c` with `d` as repeater.
- Extra example file, based on json.org

### Fixed

- Text dedenting issue in comments before sending comments to markdown parser

## [1.2.0] - 2018-11-01

### Added

- Show validation warnings for duplicate declarations
- Show validation warnings for missing references
- Option `--validate` to exit with status code 2 if document has warnings
- Option `--quiet` to suppress output to console
- Optimize EBNF syntax as `( a ), { a }` in diagram as `a+` (one or more)
- Optimize EBNF syntax as `a | { b }` in diagram as choice with "skip", "a", or
  one or more "b"
- Optimize EBNF syntax as `a | [ b ]` in diagram as choice with "skip", "a", or
  "b"

### Changed

- Long choice lists are now spread over multiple columns, if the length
  exceeds 10.
- Updated styling of document

## [1.1.0] - 2018-10-30

### Added

- `--target` option to specify output file
- Parse and render EBNF comments as markdown
- Add references to other definitions (reference To)
- Improved exception display and exit status code
- Support for `? special sequences ?`
- Support for `4 * "repeatable"` (now fully ISO compliant... I think)
- Let non-terminals link to definition in diagram
- Indent multi-line statements in EBNF output
- Optimize EBNF syntax as `a, { a }` in diagram as `a+` (one or more)

## [1.0.0] - 2018-10-29

### Added

- Parser to parse ISO/IEC 14977 EBNF files (limited support only)
- HTML output file based on filename of input file
- list definitions that reference another defintion (referenced From)
