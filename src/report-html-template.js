const { Converter } = require("showdown");
const { dedent } = require("./dedent");
const converter = new Converter({
  simplifiedAutoLink: true,
  strikethrough: true,
  tasklists: true,
  tables: true,
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

const currentDate = () => {
  const date = new Date();
  const pad = (number) => (number < 10 ? "0" + number : number);

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
};

const navigation = ({ title, content }) =>
  content.length === 0
    ? ""
    : `
    <h3>${title}:</h3>
    <ul class="nav-alphabetical">
    ${content}
    </ul>
    `;

const documentContent = ({ title, contents, toc, singleRoot }) =>
  `
  <script type="text/javascript">
    const htmlTag = document.getElementsByTagName("html")[0];
    const options = (document.location.search || "")
      .slice(1)
      .split("&")
      .map(kv => kv.split("="))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    if (options["theme"]) {
      htmlTag.classList.add("theme-" + options["theme"]);
    }
  </script>
  <header>
    <h1>${title}</h1>
    <button type="button"></button>
  </header>
  <nav>
    ${navigation({
      title: singleRoot ? "Root element" : "Root elements",
      content: toc.roots,
    })}
    ${navigation({
      title: "Quick navigation",
      content: toc.other,
    })}
    ${navigation({
      title: "Common elements",
      content: toc.common,
    })}
    ${navigation({
      title: "Character sets",
      content: toc.characterSets,
    })}
  </nav>
  <main>
  <article>
    ${contents}
  </article>
  <footer>
    <p>Date: ${currentDate()} - <a href="?theme=dark" data-theme="dark">Dark</a> - <a href="?theme=light" data-theme="light">Light</a></p>
  </footer>
  </main>
  <script type="text/javascript">
    document.querySelector("header button").addEventListener("click", function() {
      document.getElementsByTagName("html")[0].classList.toggle("menu-open");
    });
    document.querySelector("nav").addEventListener("click", function(event) {
      if (event.target.tagName !== "A") return;
      htmlTag.classList.remove("menu-open");
    });
    document.querySelectorAll("footer a").forEach(element =>
      element.addEventListener("click", function(event) {
        event.preventDefault();
        const theme = event.target.getAttribute("data-theme");
        const remove = Array.from(htmlTag.classList).filter(className => className.startsWith("theme-"));
        remove.forEach(name => htmlTag.classList.remove(name));
        htmlTag.classList.add("theme-" + theme);
      })
    );
  </script>
`;

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
    --background: white;
    --borderColor: #ccc;
    --textColor: #111;

    --diagramBackground: #f8f8f8;
    --diagramLines: black;
    --diagramText: black;
    --terminalLines: black;
    --terminalFill: #feffdf;
    --nonTerminalLines: black;
    --nonTerminalFill: #feffdf;
    --specialSequenceLines: black;
    --specialSequenceFill: #ffe79a;

    --ebnfCodeBackground: #e8e8e8;
    --ebnfIdentifier: #ef5a5a;
    --ebnfTerminal: #ffa952;
    --ebnfBaseColor: #777;
}

.theme-dark {
    --subtleText: #777;
    --highlightText: hotpink;
    --itemHeadingBackground: #444;
    --background: #333;
    --borderColor: lightblue;
    --textColor: #ddd;

    --diagramBackground: #222;
    --diagramLines: #3e432e;
    --diagramText: #a7d129;
    --terminalLines: #a7d129;
    --terminalFill: #3e432e;
    --nonTerminalLines: #a7d129;
    --nonTerminalFill: #3e432e;
    --specialSequenceLines: #a7d129;
    --specialSequenceFill: #444;

    --ebnfCodeBackground: #3e432e;
    --ebnfIdentifier: lightblue;
    --ebnfTerminal: #a7d129;
    --ebnfBaseColor: #ddd;
}

html {
    font-family: sans-serif;
}

html, body {
    margin: 0;
    padding: 0;
    background: var(--background);
    color: var(--textColor);
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
    border-bottom: 1px solid var(--borderColor);
    padding: 1rem;
}

header button {
  display: none;
}

main {
    overflow: hidden;
    margin-left: 300px;
}

nav {
    position: sticky;
    top: 0;
    max-height: 100vh;
    padding: 1rem 2rem 1rem 1rem;
    z-index: 5;
    background: var(--background);
    width: 300px;
    float: left;
    overflow: auto;
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
    width: 100%;
    overflow: hidden;
    padding: 1rem 2rem;
    border-left: 1px solid var(--borderColor);
}

article + footer {
    padding: 1rem 2rem;
    border-left: 1px solid var(--borderColor);
    background: var(--itemHeadingBackground);
}

code {
    width: 100%;
}

pre {
    overflow: auto;
}

pre > code {
    display: block;
    padding: 1em;
    background: var(--diagramBackground);
}

h4 {
    padding: 2rem;
    margin: 4rem -2rem 1rem -2rem;
    background: var(--itemHeadingBackground);
    font-size: 125%;
}

blockquote {
    margin-left: 0;
    margin-top: calc(1em - 1px);
    margin-bottom: calc(1em - 1px);
    padding: 1px 0 1px 1rem;
    border-left: 1rem solid var(--ebnfCodeBackground);
}

dfn {
    font-style: normal;
    cursor: default;
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
@media (max-width: 800px) {
  body {
    overflow-x: hidden;
  }

  header {
    padding: 0.5rem 1rem;
    display: flex;
  }

  header h1 {
    margin: 0 auto 0 0;
    display: flex;
    align-items: center;
  }

  header button {
    display: initial;
    position: relative;
    z-index: 10;
  }

  header button::after {
    content: '☰';
    margin-left: auto;
    font-size: 1.5rem;
  }

  main {
    display: block;
    position: relative;
    margin-left: 0;
  }

  nav {
    height: auto;
    display: block;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s, transform 0.2s;
    position: absolute;
    top: 0;
    right: 0;
    transform: translateX(300px);
    padding-top: 3rem;
    background: var(--background);
    box-shadow: 0 0 0 1000000rem rgba(0, 0, 0, 0.35);
  }

  .menu-open nav {
    pointer-events: auto;
    opacity: 1;
    transform: translateX(0px);
  }

  nav a {
    padding: 0.66rem 0;
  }

  article {
    margin-left: 0;
    border-left: 0;
    padding: 1rem;
  }
  article + footer {
    padding: 1rem;
    border-left: 0;
  }
}

/* EBNF text representation styling */
code.ebnf {
  padding: 1em;
  background: var(--ebnfCodeBackground);
  font-weight: bold;
  color: var(--ebnfBaseColor);
  white-space: pre-wrap;
  display: inline-block;
  width: 100%;
}
.ebnf-identifier {
  color: var(--ebnfIdentifier);
}
.ebnf-terminal {
  color: var(--ebnfTerminal);
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
  stroke: var(--diagramLines);
  fill: rgba(0,0,0,0);
}
svg.railroad-diagram text {
  font: bold 14px monospace;
  text-anchor: middle;
  fill: var(--diagramText);
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
  fill: var(--specialSequenceFill);
  stroke: var(--specialSequenceLines);
}
svg.railroad-diagram g.special-sequence text {
  font-style: italic;
}
svg.railroad-diagram rect {
  stroke-width: 3;
}
svg.railroad-diagram rect.group-box {
  stroke: gray;
  stroke-dasharray: 10 5;
  fill: none;
}
svg.railroad-diagram g.non-terminal rect {
  fill: var(--nonTerminalFill);
  stroke: var(--nonTerminalLines);
}
svg.railroad-diagram g.terminal rect {
  fill: var(--terminalFill);
  stroke: var(--terminalLines);
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

const dasherize = (str) => str.replace(/\s+/g, "-");

const referencesTemplate = (identifier, references) =>
  `<p>Items referencing <strong>${identifier}</strong>:<p>
<ul>
${references
  .map(
    (reference) =>
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
    (reference) =>
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
  referencesTo,
}) =>
  `<section>
  <h4 id="${dasherize(identifier)}">${identifier}</h4>
  <div class="diagram-container">${diagram}</div>
  <code class="ebnf">${ebnf}</code>${
    (referencedBy.length > 0
      ? "\n  " + referencesTemplate(identifier, referencedBy)
      : "") +
    (referencesTo.length > 0
      ? "\n  " + referencesToTemplate(identifier, referencesTo)
      : "")
  }
</section>
`;

const commentTemplate = (comment) => converter.makeHtml(dedent(comment));

module.exports = {
  documentContent,
  documentFrame,
  documentStyle,
  ebnfTemplate,
  commentTemplate,
};
