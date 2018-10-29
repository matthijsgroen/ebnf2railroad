const documentTemplate = ({ title, contents }) =>
  `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
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
    <header>
      <h1>${title}</h1>
    </header>
    ${contents}
  </article>
</body>
</html>
`;

const ebnfTemplate = ({ identifier, ebnf, diagram }) =>
  `<section>
  <h2 id="${identifier}">${identifier}:</h2>
  <div class="diagram-container">
  ${diagram}
  </div>
  <code>${ebnf}</code>

</section>
`;

module.exports = {
  documentTemplate,
  ebnfTemplate
};
