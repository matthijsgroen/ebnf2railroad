const traverse = classifier => travelers => transformers => {
  const transform = (node, initialResult = undefined, parents = []) => {
    const nodeType = classifier(node);

    // Travel
    const traveler = travelers[nodeType];
    const startResult = traveler
      ? traveler(node, aNext => transform(aNext, aNext, [node, ...parents]))
      : initialResult;

    // Transform
    return transformers.reduce(
      (res, transformer) =>
        typeof transformer === "function"
          ? transformer(res, node, parents)
          : transformer[nodeType]
            ? transformer[nodeType](res, node, parents)
            : res,
      startResult
    );
  };
  return transform;
};

module.exports = { traverse };
