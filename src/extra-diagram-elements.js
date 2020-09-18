const { FakeSVG, Path, Diagram } = require("railroad-diagrams");

const subclassOf = (baseClass, superClass) => {
  baseClass.prototype = Object.create(superClass.prototype);
  baseClass.prototype.$super = superClass.prototype;
};

const determineGaps = (outer, inner) => {
  const diff = outer - inner;
  switch (Diagram.INTERNAL_ALIGNMENT) {
    case "left":
      return [0, diff];
    case "right":
      return [diff, 0];
    case "center":
    default:
      return [diff / 2, diff / 2];
  }
};

const CommentWithLine = function CommentWithLine(text, { href, title } = {}) {
  if (!(this instanceof CommentWithLine))
    return new CommentWithLine(text, { href, title });
  FakeSVG.call(this, "g");
  this.text = "" + text;
  this.href = href;
  this.title = title;
  this.width = this.text.length * Diagram.COMMENT_CHAR_WIDTH + 10;
  this.height = 0;
  this.up = 11 + 2;
  this.down = 11;
  if (Diagram.DEBUG) {
    this.attrs["data-updown"] = this.up + " " + this.height + " " + this.down;
    this.attrs["data-type"] = "comment";
  }
};
subclassOf(CommentWithLine, FakeSVG);
CommentWithLine.prototype.needsSpace = true;
CommentWithLine.prototype.format = function(x, y, width) {
  // Hook up the two sides if this is narrower than its stated width.
  var gaps = determineGaps(width, this.width);
  Path(x, y)
    .h(gaps[0])
    .addTo(this);
  Path(x, y)
    .right(width)
    .addTo(this);
  Path(x + gaps[0] + this.width, y + this.height)
    .h(gaps[1])
    .addTo(this);
  x += gaps[0];

  var text = FakeSVG(
    "text",
    { x: x + this.width / 2, y: y - 5, class: "comment" },
    this.text
  );
  if (this.href) FakeSVG("a", { "xlink:href": this.href }, [text]).addTo(this);
  else text.addTo(this);
  if (this.title) new FakeSVG("title", {}, this.title).addTo(this);
  return this;
};

module.exports = {
  CommentWithLine
};
