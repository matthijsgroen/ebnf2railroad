const { getReferences } = require("./references");

const validateEbnf = (ast) => {
  const identifiers = ast.map(
    (production) => production && production.identifier
  );

  const doubleDeclarations = ast
    .map((declaration, index) => {
      // skip comments, but keep index in array intact (filter would break index)
      if (!declaration.identifier) return false;
      const firstDeclaration = identifiers.indexOf(declaration.identifier);
      if (firstDeclaration === index) return false;
      return {
        line: declaration.location,
        type: "Duplicate declaration",
        message: `"${declaration.identifier}" already declared on line ${ast[firstDeclaration].location}`,
      };
    })
    .filter(Boolean);

  const missingReferences = ast
    .filter((declaration) => declaration.identifier)
    .map((declaration) =>
      getReferences(declaration)
        .filter((item, index, list) => list.indexOf(item) === index)
        .filter((reference) => !identifiers.includes(reference))
        .map((missingReference) => ({
          line: declaration.location,
          type: "Missing reference",
          message: `"${missingReference}" is not declared`,
        }))
    )
    .filter((m) => m.length > 0)
    .reduce((acc, elem) => acc.concat(elem), []);
  return doubleDeclarations
    .concat(missingReferences)
    .sort((a, b) => a.line - b.line);
};

module.exports = {
  validateEbnf,
};
