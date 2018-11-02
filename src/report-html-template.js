const { Converter } = require("showdown");
const converter = new Converter();

const dedent = text => {
  const lines = text.split("\n");
  let minimalIndent = Infinity;

  while (lines[0] !== undefined) {
    const line = lines[0];
    if (line !== "") {
      const res = line.match(/^([^\S\n]*).*/);
      const indentDepth = res[1].length;
      minimalIndent = Math.min(minimalIndent, indentDepth);
    }
    lines.shift();
  }

  return text
    .split("\n")
    .map(v => v.slice(minimalIndent))
    .reduce((r, l) => r + l + "\n", "");
};

const documentTemplate = ({ title, contents }) =>
  `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
  <meta name="generator" content="ebnf2railroad" />
  <title>${title}</title>
  <style type="text/css">
    body {
      font: normal 12px Verdana, sans-serif;
      color: #0F0C00;
      background: #FFFCFC;
    }
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    code.ebnf {
      padding: 1em 1em 1em 3em;
      text-indent: -2em;
      background: rgb(255, 246, 209);
      display: inline-block;
    }
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
  </style>
</head>
<body>
  <article>
    ${contents}
  </article>
</body>
</html>
`;

const referencesTemplate = (identifier, references) =>
  `<p>Items referencing <strong>${identifier}</strong>:<p>
<ul>
${references
    .map(reference => `<li><a href="#${reference}">${reference}</a></li>`)
    .join("")}
</ul>
`;

const referencesToTemplate = (identifier, references) =>
  `<p><strong>${identifier}</strong> is referencing:<p>
<ul>
${references
    .map(reference => `<li><a href="#${reference}">${reference}</a></li>`)
    .join("")}
</ul>
`;

const ebnfTemplate = ({
  identifier,
  ebnf,
  diagram,
  referencedBy,
  referencesTo
}) =>
  `<section>
  <h4 id="${identifier}">${identifier}</h4>
  <div class="diagram-container">
  ${diagram}
  </div>
  <code class="ebnf">${ebnf}</code>
  ${referencedBy.length > 0 ? referencesTemplate(identifier, referencedBy) : ""}
  ${
    referencesTo.length > 0
      ? referencesToTemplate(identifier, referencesTo)
      : ""
  }
</section>
`;

const commentTemplate = comment => converter.makeHtml(dedent(comment));

module.exports = {
  documentTemplate,
  ebnfTemplate,
  commentTemplate
};
