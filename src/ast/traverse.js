const traverse = (classifier) => (travelers) => (transformers) => {
  const transform = (node, initialResult = node, parents = []) => {
    const nodeType = classifier(node);

    let transformed = false;
    // Travel
    const traveler = travelers[nodeType];
    const updatedNode = traveler
      ? traveler(node, (aNext) => {
          const result = transform(aNext, aNext, [node, ...parents]);
          if (result !== aNext) {
            transformed = true;
          }
          return result;
        })
      : initialResult;

    const startResult = transformed ? updatedNode : initialResult;

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
