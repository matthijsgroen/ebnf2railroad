const { Converter } = require("showdown");
const { dedent } = require("./dedent");
const converter = new Converter({
  simplifiedAutoLink: true
});

const documentTemplate = ({
  title,
  contents,
  specifiedToc,
  alphabeticalToc,
  hierarchicalToc
}) =>
  `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
  <meta name="generator" content="ebnf2railroad" />
  <title>${title}</title>
  <style type="text/css">
    /* Text styling */
    body {
      font: normal 12px Verdana, sans-serif;
      color: #0F0C00;
      background: #FFFCFC;
    }
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    a,
    a:visited,
    a:active {
      color: #0F0C00;
    }
    a:hover {
      color: #000;
    }
		section h4 {
			margin-bottom: 0;
		}

    /* EBNF text representation styling */
    code.ebnf {
      padding: 1em 1em 1em 3em;
      text-indent: -2em;
      background: rgb(255, 246, 209);
      font-weight: bold;
      color: #777;
      white-space: nowrap;
      display: inline-block;
    }
    .ebnf-identifier {
      color: #990099;
    }
    .ebnf-terminal {
      color: #009900;
    }
    .ebnf-non-terminal {
      font-weight: normal;
    }
    .ebnf-comment {
      font-weight: normal;
      font-style: italic;
      color: #999;
    }

    /* EBNF diagram representation styling */
    svg.railroad-diagram path {
        stroke-width: 3;
        stroke: black;
        fill: rgba(0,0,0,0);
    }
    svg.railroad-diagram text {
        font: bold 14px monospace;
        text-anchor: middle;
    }
    svg.railroad-diagram text.diagram-text {
        font-size: 12px;
    }
    svg.railroad-diagram text.diagram-arrow {
        font-size: 16px;
    }
    svg.railroad-diagram text.label {
        text-anchor: start;
    }
    svg.railroad-diagram text.comment {
        font: italic 12px monospace;
    }
    svg.railroad-diagram g.non-terminal text {
        /*font-style: italic;*/
    }
    svg.railroad-diagram g.special-sequence rect {
        fill: #FFDB4D;
    }
    svg.railroad-diagram g.special-sequence text {
        font-style: italic;
    }
    svg.railroad-diagram rect {
        stroke-width: 3;
        stroke: black;
    }
    svg.railroad-diagram g.non-terminal rect {
        fill: hsl(120,100%,90%);
    }
    svg.railroad-diagram g.terminal rect {
        fill: hsl(120,100%,90%);
    }
    svg.railroad-diagram path.diagram-text {
        stroke-width: 3;
        stroke: black;
        fill: white;
        cursor: help;
    }
    svg.railroad-diagram g.diagram-text:hover path.diagram-text {
        fill: #eee;
    }

    /* Table of contents styling */

    nav input { display: none; }
    nav input + label { text-decoration: underline; cursor: pointer; }
    nav input:checked + label { font-weight: bold; }

    nav > ul { display: none; }
    nav #nav-as-specified:checked ~ ul.nav-as-specified { display: block; }
    nav #nav-alphabetical:checked ~ ul.nav-alphabetical { display: block; }
    nav #nav-hierarchical:checked ~ ul.nav-hierarchical { display: block; }
  </style>
</head>
<body>
  <nav>
    <h3>Navigation</h3>
    <input id="nav-as-specified" name="viewmode" value="as-specified" type="radio" checked="checked">
    <label for="nav-as-specified">As specified</label>
    <input id="nav-alphabetical" name="viewmode" value="alphabetical" type="radio">
    <label for="nav-alphabetical">Alphabetical</label>
    <input id="nav-hierarchical" name="viewmode" value="hierarchical" type="radio">
    <label for="nav-hierarchical">Hierarchical</label>

    <ul class="nav-as-specified">
    ${specifiedToc}
    </ul>

    <ul class="nav-alphabetical">
    ${alphabeticalToc}
    </ul>

    <ul class="nav-hierarchical">
    ${hierarchicalToc}
    </ul>
  </nav>
  <article>
    ${contents}
  </article>
</body>
</html>
`;

const dasherize = str => str.replace(/\s+/g, "-");

const referencesTemplate = (identifier, references) =>
  `<p>Items referencing <strong>${identifier}</strong>:<p>
<ul>
${references
    .map(
      reference =>
        `<li><a href="#${dasherize(reference)}">${reference}</a></li>`
    )
    .join("")}
</ul>`;

const referencesToTemplate = (identifier, references) =>
  `<p><strong>${identifier}</strong> is referencing:<p>
<ul>
${references
    .map(
      reference =>
        `<li><a href="#${dasherize(reference)}">${reference}</a></li>`
    )
    .join("")}
</ul>`;

const ebnfTemplate = ({
  identifier,
  ebnf,
  diagram,
  referencedBy,
  referencesTo
}) =>
  `<section>
  <h4 id="${dasherize(identifier)}">${identifier}</h4>
  <div class="diagram-container">
  ${diagram}  </div>
  <code class="ebnf">${ebnf}</code>${(referencedBy.length > 0
    ? "\n  " + referencesTemplate(identifier, referencedBy)
    : "") +
    (referencesTo.length > 0
      ? "\n  " + referencesToTemplate(identifier, referencesTo)
      : "")}
</section>
`;

const commentTemplate = comment => converter.makeHtml(dedent(comment));

module.exports = {
  documentTemplate,
  ebnfTemplate,
  commentTemplate
};
