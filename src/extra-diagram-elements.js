const {
  FakeSVG,
  Path,
  Diagram,
  Comment,
  Terminal
} = require("railroad-diagrams");

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

function wrapString(value) {
  return value instanceof FakeSVG ? value : new Terminal("" + value);
}

const Group = function Group(item, label) {
  if (!(this instanceof Group)) return new Group(item, label);
  FakeSVG.call(this, "g");
  this.item = wrapString(item);
  this.label =
    label instanceof FakeSVG ? label : label ? new Comment(label) : undefined;

  this.width = Math.max(
    this.item.width + (this.item.needsSpace ? 20 : 0),
    this.label ? this.label.width : 0,
    Diagram.ARC_RADIUS * 2
  );
  this.height = this.item.height;
  this.boxUp = this.up = Math.max(
    this.item.up + Diagram.VERTICAL_SEPARATION,
    Diagram.ARC_RADIUS
  );
  if (this.label) {
    this.up += this.label.up + this.label.height + this.label.down;
  }
  this.down = Math.max(
    this.item.down + Diagram.VERTICAL_SEPARATION,
    Diagram.ARC_RADIUS
  );
  this.needsSpace = true;
  if (Diagram.DEBUG) {
    this.attrs["data-updown"] = this.up + " " + this.height + " " + this.down;
    this.attrs["data-type"] = "group";
  }
};
subclassOf(Group, FakeSVG);
Group.prototype.needsSpace = true;
Group.prototype.format = function(x, y, width) {
  var gaps = determineGaps(width, this.width);
  new Path(x, y).h(gaps[0]).addTo(this);
  new Path(x + gaps[0] + this.width, y + this.height).h(gaps[1]).addTo(this);
  x += gaps[0];

  new FakeSVG("rect", {
    x,
    y: y - this.boxUp,
    width: this.width,
    height: this.boxUp + this.height + this.down,
    rx: Diagram.ARC_RADIUS,
    ry: Diagram.ARC_RADIUS,
    class: "group-box"
  }).addTo(this);

  this.item.format(x, y, this.width).addTo(this);
  if (this.label) {
    this.label
      .format(
        x,
        y - (this.boxUp + this.label.down + this.label.height),
        this.label.width
      )
      .addTo(this);
  }

  return this;
};

module.exports = {
  CommentWithLine,
  Group
};
