# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Split navigation bar in 3 parts. Root elements, Normal elements,
  Common elements
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
- Support for alternative characters: `|` -> `/`, `!`, `[ ]` -> `(/ /)`,
  `{ }` -> `(: :)`
- Table of contents, showing structure in alphabet, or as
  hierarchy overview at the bottom.
- Optimize EBNF syntax as `a | a` into `a`
- Optimize EBNF syntax as `a | a, b` into `a, [ b ]`
- Optimize EBNF syntax as `a, b, c, g | a, b, d, g` into `a, b, ( c | d ), g`

### Fixed
- Closing tag for Terminals with single quotes
- Issue when the chain was optimized without repeater
  `a, b, c, { b, c }`.

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
- Add support for comments within statements, that will be rendered
  within the diagram
- Option `--title` to add a title to the output document
- Show different start/end indicators if diagram is 'complex' (refers to
  other definitions)
- Better optimization of repeating elements. `a, b, c, { d, b, c }` will
  display `a` followed by a loop containing `b, c` with `d` as repeater.
- Extra example file, based on json.org

### Fixed
- Text dedenting issue in comments before sending comments to markdown parser

## [1.2.0] - 2018-11-01
### Added
- Show validation warnings for duplicate declarations
- Show validation warnings for missing references
- Option `--validate` to exit with status code 2 if document has
  warnings
- Option `--quiet` to suppress output to console
- Optimize EBNF syntax as `( a ), { a }` in diagram as `a+` (one or more)
- Optimize EBNF syntax as `a | { b }` in diagram as choice with "skip",
  "a", or one or more "b"
- Optimize EBNF syntax as `a | [ b ]` in diagram as choice with "skip",
  "a", or "b"

### Changed
- Long choice lists are now spread over multiple columns, if the
  length exceeds 10.
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
