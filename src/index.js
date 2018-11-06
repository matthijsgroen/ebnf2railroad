import "./index.css";

const ace = require("brace");
require("brace/mode/plain_text");
require("brace/theme/monokai");
const ebnf = require("ebnf2railroad");
console.log(ebnf);

const editor = ace.edit("editor");
editor.getSession().setMode("ace/mode/plain_text");
editor.setTheme("ace/theme/monokai");
editor.getSession().on("change", () => {
  const newValue = editor.getValue();
  try {
    const ast = parseEbnf(newValue);
  } catch (e) {
    console.log(e.message);
  }
  console.log(newValue);
});
