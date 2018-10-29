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
      background: #FFFCF0;
    }
    code {
      padding: 1em;
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
    h2 {
      margin: 2em 0 0;
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

const ebnfTemplate = ({ identifier, ebnf, diagram, references }) =>
  `<section>
  <h2 id="${identifier}">${identifier}:</h2>
  <div class="diagram-container">
  ${diagram}
  </div>
  <code>${ebnf}</code>
  ${references.length > 0 ? referencesTemplate(identifier, references) : ""}
</section>
`;

const PARAGRAPH = "p";
const HEADER = "h";

const commentTemplate = comment =>
  comment
    .split("\n")
    .map(e => ({ type: PARAGRAPH, content: e.trim() }))
    .reduce((acc, item, index, src) => {
      const ahead = src[index + 1];
      const lastAcc = acc[acc.length - 1];
      if (
        item.type === PARAGRAPH &&
        item.content.length > 0 &&
        ahead &&
        ahead.type === PARAGRAPH &&
        ahead.content.length === 0 &&
        (!lastAcc || lastAcc.type !== HEADER)
      ) {
        return acc.concat({ type: HEADER, content: item.content });
      }
      if (
        item.type === PARAGRAPH &&
        item.content.length === 0 &&
        lastAcc.type === HEADER
      ) {
        return acc;
      }
      return acc.concat(item);
    }, [])
    .map(
      item =>
        item.type === PARAGRAPH
          ? `<p>${item.content}</p>`
          : item.type === HEADER
            ? `<h1>${item.content}</h1>`
            : ""
    )
    .join("");

module.exports = {
  documentTemplate,
  ebnfTemplate,
  commentTemplate
};
