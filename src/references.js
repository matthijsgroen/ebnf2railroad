const getReferences = production => {
  if (production.definition) {
    return getReferences(production.definition);
  }
  if (production.terminal) {
    return [];
  }
  if (production.nonTerminal) {
    return [production.nonTerminal];
  }
  if (production.choice) {
    return production.choice
      .map(item => getReferences(item))
      .reduce((acc, item) => acc.concat(item), [])
      .filter(Boolean);
  }
  if (production.sequence) {
    return production.sequence
      .map(item => getReferences(item))
      .reduce((acc, item) => acc.concat(item), [])
      .filter(Boolean);
  }
  if (production.repetition) {
    return getReferences(production.repetition);
  }
  if (production.optional) {
    return getReferences(production.optional);
  }
  if (production.group) {
    return getReferences(production.group);
  }
  if (production.exceptNonTerminal) {
    return [production.exceptNonTerminal, production.include];
  }
  if (production.exceptTerminal) {
    return [production.include];
  }
  return [];
};

const searchReferencesToIdentifier = (identifier, ast) =>
  ast
    .filter(production => production.identifier !== identifier)
    .filter(production =>
      getReferences(production).some(ref => ref === identifier)
    )
    .map(production => production.identifier);

const searchReferencesFromIdentifier = (identifier, ast) =>
  ast
    .filter(production => production.identifier === identifier)
    .map(production => getReferences(production))
    .reduce((acc, item) => acc.concat(item), [])
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index);

module.exports = {
  getReferences,
  searchReferencesFromIdentifier,
  searchReferencesToIdentifier
};
