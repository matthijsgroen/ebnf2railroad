const {
  FakeSVG,
  Path,
  Diagram,
  Comment,
  Terminal,
  DiagramMultiContainer,
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
CommentWithLine.prototype.format = function (x, y, width) {
  // Hook up the two sides if this is narrower than its stated width.
  var gaps = determineGaps(width, this.width);
  Path(x, y).h(gaps[0]).addTo(this);
  Path(x, y).right(width).addTo(this);
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
Group.prototype.format = function (x, y, width) {
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
    class: "group-box",
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

var Choice = function Choice(normal, items) {
  if (!(this instanceof Choice))
    return new Choice(normal, [].slice.call(arguments, 1));
  DiagramMultiContainer.call(this, "g", items);
  if (typeof normal !== "number" || normal !== Math.floor(normal)) {
    throw new TypeError("The first argument of Choice() must be an integer.");
  } else if (normal < 0 || normal >= items.length) {
    throw new RangeError(
      "The first argument of Choice() must be an index for one of the items."
    );
  } else {
    this.normal = normal;
  }
  var first = 0;
  var last = items.length - 1;
  this.width =
    Math.max.apply(
      null,
      this.items.map(function (el) {
        return el.width;
      })
    ) +
    Diagram.ARC_RADIUS * 4;
  this.height = this.items[normal].height;
  this.up = this.items[first].up;
  for (var i = first; i < normal; i++) {
    let arcs = i == normal + 1 ? Diagram.ARC_RADIUS * 2 : Diagram.ARC_RADIUS;
    this.up += Math.max(
      arcs,
      this.items[i].height +
        this.items[i].down +
        Diagram.VERTICAL_SEPARATION +
        this.items[i + 1].up
    );
  }
  // Fix over the Choice of 'railroad-diagrams': height of the last item had to be added as well.
  this.down = this.items[last].down + this.items[last].height;
  for (let i = normal + 1; i <= last; i++) {
    let arcs = i == normal + 1 ? Diagram.ARC_RADIUS * 2 : Diagram.ARC_RADIUS;
    this.down += Math.max(
      arcs,
      this.items[i - 1].height +
        this.items[i - 1].down +
        Diagram.VERTICAL_SEPARATION +
        this.items[i].up
    );
  }
  this.down -= this.items[normal].height; // already counted in Choice.height
  if (Diagram.DEBUG) {
    this.attrs["data-updown"] = this.up + " " + this.height + " " + this.down;
    this.attrs["data-type"] = "choice";
  }
};
subclassOf(Choice, DiagramMultiContainer);
Choice.prototype.format = function (x, y, width) {
  // Hook up the two sides if this is narrower than its stated width.
  var gaps = determineGaps(width, this.width);
  Path(x, y).h(gaps[0]).addTo(this);
  Path(x + gaps[0] + this.width, y + this.height)
    .h(gaps[1])
    .addTo(this);
  x += gaps[0];

  var last = this.items.length - 1;
  var innerWidth = this.width - Diagram.ARC_RADIUS * 4;

  let distanceFromY = 0;
  // Do the elements that curve above
  for (var i = this.normal - 1; i >= 0; i--) {
    var item = this.items[i];
    if (i == this.normal - 1) {
      distanceFromY = Math.max(
        Diagram.ARC_RADIUS * 2,
        this.items[this.normal].up +
          Diagram.VERTICAL_SEPARATION +
          item.down +
          item.height
      );
    }
    Path(x, y)
      .arc("se")
      .up(distanceFromY - Diagram.ARC_RADIUS * 2)
      .arc("wn")
      .addTo(this);
    item
      .format(x + Diagram.ARC_RADIUS * 2, y - distanceFromY, innerWidth)
      .addTo(this);
    Path(
      x + Diagram.ARC_RADIUS * 2 + innerWidth,
      y - distanceFromY + item.height
    )
      .arc("ne")
      .down(distanceFromY - item.height + this.height - Diagram.ARC_RADIUS * 2)
      .arc("ws")
      .addTo(this);
    distanceFromY += Math.max(
      Diagram.ARC_RADIUS,
      item.up +
        Diagram.VERTICAL_SEPARATION +
        (i == 0 ? 0 : this.items[i - 1].down + this.items[i - 1].height)
    );
  }

  // Do the straight-line path.
  Path(x, y)
    .right(Diagram.ARC_RADIUS * 2)
    .addTo(this);
  this.items[this.normal]
    .format(x + Diagram.ARC_RADIUS * 2, y, innerWidth)
    .addTo(this);
  Path(x + Diagram.ARC_RADIUS * 2 + innerWidth, y + this.height)
    .right(Diagram.ARC_RADIUS * 2)
    .addTo(this);

  // Do the elements that curve below
  distanceFromY = 0;
  for (let i = this.normal + 1; i <= last; i++) {
    let item = this.items[i];
    if (i == this.normal + 1) {
      distanceFromY = Math.max(
        Diagram.ARC_RADIUS * 2,
        this.height +
          this.items[this.normal].down +
          Diagram.VERTICAL_SEPARATION +
          item.up
      );
    }
    Path(x, y)
      .arc("ne")
      .down(distanceFromY - Diagram.ARC_RADIUS * 2)
      .arc("ws")
      .addTo(this);
    item
      .format(x + Diagram.ARC_RADIUS * 2, y + distanceFromY, innerWidth)
      .addTo(this);
    Path(
      x + Diagram.ARC_RADIUS * 2 + innerWidth,
      y + distanceFromY + item.height
    )
      .arc("se")
      .up(distanceFromY - Diagram.ARC_RADIUS * 2 + item.height - this.height)
      .arc("wn")
      .addTo(this);
    distanceFromY += Math.max(
      Diagram.ARC_RADIUS,
      item.height +
        item.down +
        Diagram.VERTICAL_SEPARATION +
        (i == last ? 0 : this.items[i + 1].up)
    );
  }

  return this;
};

module.exports = {
  Choice,
  CommentWithLine,
  Group,
};
