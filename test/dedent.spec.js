const { expect } = require("chai");
const { dedent } = require("../src/dedent");

describe("dedent", () => {
  it("shifts the text to its margin, while keeping indentations", () => {
    const result = dedent(`
      Line 1, indented.
        Line 2, sub-indented
          Line 3, sub-sub-indented
      Line 4, indented
    `); // this line has the least spaces, but has no other content

    const lines = result.split("\n");
    expect(lines[0]).to.match(/^$/);
    expect(lines[1]).to.match(/^Line 1/);
    expect(lines[2]).to.match(/^\s{2}Line 2/);
    expect(lines[3]).to.match(/^\s{4}Line 3/);
    expect(lines[4]).to.match(/^Line 4/);
    expect(lines[5]).to.match(/^$/);
  });

  it("supports having the first line indented as well", () => {
    const result = dedent(`
          Line 1, sub-sub-indented
        Line 2, sub-indented
      Line 3, indented.
    `); // this line has the least spaces, but has no other content

    const lines = result.split("\n");
    expect(lines[0]).to.match(/^$/);
    expect(lines[1]).to.match(/^\s{4}Line 1/);
    expect(lines[2]).to.match(/^\s{2}Line 2/);
    expect(lines[3]).to.match(/^Line 3/);
    expect(lines[4]).to.match(/^$/);
  });
});
