import "./index.css";

const ace = require("brace");
require("brace/mode/plain_text");
require("brace/theme/monokai");

const editor = ace.edit("editor");
editor.getSession().setMode("ace/mode/plain_text");
editor.setTheme("ace/theme/monokai");
