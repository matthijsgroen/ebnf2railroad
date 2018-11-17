const { Converter } = require("showdown");
const { dedent } = require("./dedent");
const converter = new Converter({
  simplifiedAutoLink: true,
  strikethrough: true,
  tasklists: true,
  tables: true
});

const documentFrame = ({ head, body, title }) =>
  `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
  <meta name="generator" content="ebnf2railroad" />
  <title>${title}</title>
  ${head}
</head>
<body>
${body}
</body>
</html>
`;

const documentContent = ({ title, contents, toc, singleRoot }) =>
  `<header>
    <h1>${title}</h1>
  </header>
  <main>
  <nav>
    <h3>Root element${singleRoot ? "" : "s"}:</h3>
    <ul class="nav-alphabetical">
    ${toc.roots}
    </ul>
    <h3>Quick navigation:</h3>
    <ul class="nav-alphabetical">
    ${toc.other}
    </ul>
    <h3>Common elements:</h3>
    <ul class="nav-alphabetical">
    ${toc.common}
    </ul>
  </nav>
  <article>
    ${contents}
  </article>
  </main>`;

const documentStyle = () =>
  `
html {
  box-sizing: border-box;
}

*, *:before, *:after {
  box-sizing: inherit;
}

:root {
  --subtleText: #777;
  --highlightText: hotpink;
  --itemHeadingBackground: #eee;
  --diagramBackground: #f8f8f8;
}

html {
  font-family: sans-serif;
}

html, body {
  margin: 0;
  padding: 0;
}

a {
  color: inherit;
}

a:visited {
  color: var(--subtleText);
}

a:active, a:focus, a:hover {
  color: var(--highlightText);
}

header {
  border-bottom: 1px solid #ccc;
  padding: 1rem;
}

main {
  display: flex;
  overflow: hidden;
}

nav {
  padding: 1rem 2rem 1rem 1rem;
}

nav h3 {
  white-space: nowrap;
}

nav ul {
  list-style: none;
  padding: 0;
}

nav a {
  display: inline-block;
  color: var(--subtleText);
  text-decoration: none;
  padding: 0.33rem 0;
}

article {
  padding: 1rem 2rem;
  margin-left: 1rem;
  border-left: 1px solid #ccc;
}

code {
  width: 100%;
}

h4 {
  padding: 2rem;
  margin: 4rem -2rem 1rem -2rem;
  background: var(--itemHeadingBackground);
  font-size: 125%;
}

.diagram-container {
  background: var(--diagramBackground);
  margin-bottom: 0.25rem;
  padding: 1rem 0;
  display: flex;
  justify-content: center;
  overflow: auto;
}

/* Responsiveness */
@media (max-width: 640px) {
  header {
    padding: 0.5rem 1rem;
  }

  header h1 {
    margin: 0;
    display: flex;
    align-items: center;
  }

  header h1::after {
    content: '☰';
    margin-left: auto;
  }

  main {
    display: block;
    position: relative;
  }

  nav a {
    padding: 0.66rem 0;
  }

  article {
    margin-left: 0;
    border-left: 0;
    padding: 1rem;
  }
}

/* EBNF text representation styling */
code.ebnf {
  padding: 1em;
  background: rgb(255, 246, 209);
  font-weight: bold;
  color: #777;
  white-space: pre-wrap;
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
svg.railroad-diagram {
  width: 100%;
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
`;

const dasherize = str => str.replace(/\s+/g, "-");

const referencesTemplate = (identifier, references) =>
  `<p>Items referencing <strong>${identifier}</strong>:<p>
<ul>
${references
    .map(
      reference =>
        `<li><a href="#${dasherize(
          reference.trim()
        )}">${reference.trim()}</a></li>`
    )
    .join("")}
</ul>`;

const referencesToTemplate = (identifier, references) =>
  `<p><strong>${identifier}</strong> is referencing:<p>
<ul>
${references
    .map(
      reference =>
        `<li><a href="#${dasherize(
          reference.trim()
        )}">${reference.trim()}</a></li>`
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
  documentContent,
  documentFrame,
  documentStyle,
  ebnfTemplate,
  commentTemplate
};
