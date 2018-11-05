const {
  searchReferencesFromIdentifier,
  searchReferencesToIdentifier
} = require("./references");

const createAlphabeticalToc = ast =>
  ast
    .filter(production => production.identifier)
    .map(production => production.identifier)
    .reduce((acc, item) => acc.concat(item), [])
    .filter((item, index, list) => list.indexOf(item) === index)
    .sort()
    .map(node => ({ name: node }));

const createPath = (production, ast, path) => {
  const leaf = {
    name: production.identifier
  };
  if (path.includes(leaf.name)) {
    leaf.recursive = true;
  } else {
    const subPath = path.concat(production.identifier);
    const children = searchReferencesFromIdentifier(
      production.identifier,
      ast
    ).map(child =>
      createPath(
        ast.find(production => production.identifier === child),
        ast,
        subPath
      )
    );
    if (children.length > 0) {
      leaf.children = children;
    }
  }

  return leaf;
};

const createStructuralToc = ast =>
  ast
    .filter(
      production =>
        production.identifier &&
        searchReferencesToIdentifier(production.identifier, ast).length === 0
    )
    .map(root => createPath(root, ast, []));

const createToc = ast =>
  ast
    .filter(production => production.identifier)
    .map(production => production.identifier)
    .reduce((acc, item) => acc.concat(item), [])
    .filter((item, index, list) => list.indexOf(item) === index)
    .map(node => ({ name: node }));

module.exports = {
  createAlphabeticalToc,
  createStructuralToc,
  createToc
};
