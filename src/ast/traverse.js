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

const traverse = classifier => {
  const transformers = [];
  const travelers = [];

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
    const traveler = travelers.find(x => x[0] === nodeType);
    const startResult = traveler
      ? traveler[1](a, aNext => transform(aNext))
      : initialResult;

    return transformNode(a, nodeType, startResult);
  };

  return {
    addTransform: transformer => transformers.push(transformer),
    addTraveler: (nodeType, traveler) => travelers.push([nodeType, traveler]),
    transform
  };
};

module.exports = { traverse };
