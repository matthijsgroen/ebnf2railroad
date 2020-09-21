/**
 * type Transform<A, B> = (node: A, previous: B) => B;
 *
 * type TransformMatcher = {
 *   match: (node: A) => boolean;
 *   transform: (transform: Transform<A, B>, node: A, result: B) => B
 * }
 *
 * const traverse = <A, B>(transformers: NodeTransformer<A, B>[]) =>
 *   (node: A, initial: B, Transform<A, B>) => B;
 */

const traverse = classifier => travelers => transformers => {
  const transform = (node, initialResult = undefined) => {
    const nodeType = classifier(node);

    // Travel
    const traveler = travelers[nodeType];
    const startResult = traveler
      ? traveler(node, aNext => transform(aNext))
      : initialResult;

    // Transform
    return transformers.reduce(
      (res, transformer) =>
        transformer[nodeType] ? transformer[nodeType](node, res) : res,
      startResult
    );
  };
  return transform;
};

module.exports = { traverse };
