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
  const transformNode = (node, nodeType, initialResult) => {
    // Transform
    const result = transformers.reduce(
      (res, transformer) =>
        transformer[nodeType] ? transformer[nodeType](node, res) : res,
      initialResult
    );

    return result;
  };

  const transform = (a, initialResult = undefined) => {
    const nodeType = classifier(a);

    // Travel
    const traveler = travelers[nodeType];
    const startResult = traveler
      ? traveler(a, aNext => transform(aNext))
      : initialResult;

    return transformNode(a, nodeType, startResult);
  };
  return transform;
};

module.exports = { traverse };
