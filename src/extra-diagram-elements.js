const {
  FakeSVG,
  Path,
  Comment,
  Terminal,
  DiagramMultiContainer,
  Options,
} = require("@prantlf/railroad-diagrams");

const determineGaps = (outer, inner) => {
  const diff = outer - inner;
  switch (Options.INTERNAL_ALIGNMENT) {
    case "left":
      return [0, diff];
    case "right":
      return [diff, 0];
    case "center":
    default:
      return [diff / 2, diff / 2];
  }
};

class CommentWithLine extends FakeSVG {
  constructor(text, { href, title } = {}) {
    super("g");
    this.text = "" + text;
    this.href = href;
    this.title = title;
    this.width = this.text.length * Options.COMMENT_CHAR_WIDTH + 10;
    this.height = 0;
    this.up = 11 + 2;
    this.down = 11;
    this.needsSpace = true;
    if (Options.DEBUG) {
      this.attrs["data-updown"] = this.up + " " + this.height + " " + this.down;
      this.attrs["data-type"] = "comment";
    }
  }

  format(x, y, width) {
    // Hook up the two sides if this is narrower than its stated width.
    var gaps = determineGaps(width, this.width);
    new Path(x, y).h(gaps[0]).addTo(this);
    new Path(x, y).right(width).addTo(this);
    new Path(x + gaps[0] + this.width, y + this.height).h(gaps[1]).addTo(this);
    x += gaps[0];

    var text = new FakeSVG(
      "text",
      { x: x + this.width / 2, y: y - 5, class: "comment" },
      this.text
    );
    if (this.href)
      new FakeSVG("a", { "xlink:href": this.href }, [text]).addTo(this);
    else text.addTo(this);
    if (this.title) new FakeSVG("title", {}, this.title).addTo(this);
    return this;
  }
}

// Keep the spacing of the previous railroad-diagrams version (up/down went from 11 to 8),
// so comment labels above group boxes keep clear of the border.
class SpacedComment extends Comment {
  constructor(text, options) {
    super(text, options);
    this.up = 11;
    this.down = 11;
  }
}

function wrapString(value) {
  return value instanceof FakeSVG ? value : new Terminal("" + value);
}

class Group extends FakeSVG {
  constructor(item, label) {
    super("g");
    this.item = wrapString(item);
    this.label =
      label instanceof FakeSVG ? label : label ? new Comment(label) : undefined;

    this.width = Math.max(
      this.item.width + (this.item.needsSpace ? 20 : 0),
      this.label ? this.label.width : 0,
      Options.AR * 2
    );
    this.height = this.item.height;
    this.boxUp = this.up = Math.max(this.item.up + Options.VS, Options.AR);
    if (this.label) {
      this.up += this.label.up + this.label.height + this.label.down;
    }
    this.down = Math.max(this.item.down + Options.VS, Options.AR);
    this.needsSpace = true;
    if (Options.DEBUG) {
      this.attrs["data-updown"] = this.up + " " + this.height + " " + this.down;
      this.attrs["data-type"] = "group";
    }
  }

  format(x, y, width) {
    var gaps = determineGaps(width, this.width);
    new Path(x, y).h(gaps[0]).addTo(this);
    new Path(x + gaps[0] + this.width, y + this.height).h(gaps[1]).addTo(this);
    x += gaps[0];

    new FakeSVG("rect", {
      x,
      y: y - this.boxUp,
      width: this.width,
      height: this.boxUp + this.height + this.down,
      rx: Options.AR,
      ry: Options.AR,
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
  }
}

class Choice extends DiagramMultiContainer {
  constructor(normal, ...items) {
    super("g", items);
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
      Options.AR * 4;
    this.height = this.items[normal].height;
    this.up = this.items[first].up;
    for (var i = first; i < normal; i++) {
      let arcs = i == normal + 1 ? Options.AR * 2 : Options.AR;
      this.up += Math.max(
        arcs,
        this.items[i].height +
          this.items[i].down +
          Options.VS +
          this.items[i + 1].up
      );
    }
    // Fix over the Choice of 'railroad-diagrams': height of the last item had to be added as well.
    this.down = this.items[last].down + this.items[last].height;
    for (let i = normal + 1; i <= last; i++) {
      let arcs = i == normal + 1 ? Options.AR * 2 : Options.AR;
      this.down += Math.max(
        arcs,
        this.items[i - 1].height +
          this.items[i - 1].down +
          Options.VS +
          this.items[i].up
      );
    }
    this.down -= this.items[normal].height; // already counted in Choice.height
    if (Options.DEBUG) {
      this.attrs["data-updown"] = this.up + " " + this.height + " " + this.down;
      this.attrs["data-type"] = "choice";
    }
  }

  format(x, y, width) {
    // Hook up the two sides if this is narrower than its stated width.
    var gaps = determineGaps(width, this.width);
    new Path(x, y).h(gaps[0]).addTo(this);
    new Path(x + gaps[0] + this.width, y + this.height).h(gaps[1]).addTo(this);
    x += gaps[0];

    var last = this.items.length - 1;
    var innerWidth = this.width - Options.AR * 4;

    let distanceFromY = 0;
    // Do the elements that curve above
    for (var i = this.normal - 1; i >= 0; i--) {
      var item = this.items[i];
      if (i == this.normal - 1) {
        distanceFromY = Math.max(
          Options.AR * 2,
          this.items[this.normal].up + Options.VS + item.down + item.height
        );
      }
      new Path(x, y)
        .arc("se")
        .up(distanceFromY - Options.AR * 2)
        .arc("wn")
        .addTo(this);
      item
        .format(x + Options.AR * 2, y - distanceFromY, innerWidth)
        .addTo(this);
      new Path(x + Options.AR * 2 + innerWidth, y - distanceFromY + item.height)
        .arc("ne")
        .down(distanceFromY - item.height + this.height - Options.AR * 2)
        .arc("ws")
        .addTo(this);
      distanceFromY += Math.max(
        Options.AR,
        item.up +
          Options.VS +
          (i == 0 ? 0 : this.items[i - 1].down + this.items[i - 1].height)
      );
    }

    // Do the straight-line path.
    new Path(x, y).right(Options.AR * 2).addTo(this);
    this.items[this.normal]
      .format(x + Options.AR * 2, y, innerWidth)
      .addTo(this);
    new Path(x + Options.AR * 2 + innerWidth, y + this.height)
      .right(Options.AR * 2)
      .addTo(this);

    // Do the elements that curve below
    distanceFromY = 0;
    for (let i = this.normal + 1; i <= last; i++) {
      let item = this.items[i];
      if (i == this.normal + 1) {
        distanceFromY = Math.max(
          Options.AR * 2,
          this.height + this.items[this.normal].down + Options.VS + item.up
        );
      }
      new Path(x, y)
        .arc("ne")
        .down(distanceFromY - Options.AR * 2)
        .arc("ws")
        .addTo(this);
      item
        .format(x + Options.AR * 2, y + distanceFromY, innerWidth)
        .addTo(this);
      new Path(x + Options.AR * 2 + innerWidth, y + distanceFromY + item.height)
        .arc("se")
        .up(distanceFromY - Options.AR * 2 + item.height - this.height)
        .arc("wn")
        .addTo(this);
      distanceFromY += Math.max(
        Options.AR,
        item.height +
          item.down +
          Options.VS +
          (i == last ? 0 : this.items[i + 1].up)
      );
    }

    return this;
  }
}

const factory =
  (Element) =>
  (...args) =>
    new Element(...args);

module.exports = {
  Choice: factory(Choice),
  Comment: factory(SpacedComment),
  CommentWithLine: factory(CommentWithLine),
  Group: factory(Group),
};
