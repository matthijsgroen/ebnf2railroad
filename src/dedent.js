const dedent = (text) => {
  const lines = text.split("\n");
  let minimalIndent = Infinity;

  while (lines[0] !== undefined) {
    const line = lines[0];
    if (!/^\s*$/.test(line)) {
      const res = line.match(/^([^\S\n]*).*/);
      const indentDepth = res[1].length;
      minimalIndent = Math.min(minimalIndent, indentDepth);
    }
    lines.shift();
  }

  return text
    .split("\n")
    .map((v) => v.slice(minimalIndent))
    .reduce((r, l) => r + l + "\n", "");
};

module.exports = {
  dedent,
};
