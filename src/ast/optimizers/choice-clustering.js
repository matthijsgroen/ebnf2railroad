const { NodeTypes } = require("../ebnf-transform");

const skipFirst = (list) =>
  [
    list.some((e) => e === "skip" || e.skip) && { skip: true },
    ...list.filter((e) => e !== "skip" && !e.skip),
  ].filter(Boolean);

const equalElements = (first, second) =>
  JSON.stringify(first) === JSON.stringify(second);

module.exports = {
  [NodeTypes.Choice]: (current) => {
    if (!current.choice) return current;

    const isCertain = (elem) =>
      (elem.terminal && elem) || (elem.nonTerminal && elem);

    const groupElements = (elements) => {
      const allSet = elements.every((f) => f);
      if (!allSet) return {};
      return elements.reduce((acc, elem) => {
        const key = JSON.stringify(elem);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
    };
    const countSame = (groupElements) => {
      const amounts = Object.values(groupElements);
      return Math.max(...amounts);
    };

    const collectCertainFirstElements = current.choice.map(
      (elem) =>
        isCertain(elem) || (elem.sequence && isCertain(elem.sequence[0]))
    );
    const collectCertainLastElements = current.choice.map(
      (elem) =>
        isCertain(elem) ||
        (elem.sequence && isCertain(elem.sequence[elem.sequence.length - 1]))
    );
    const groupFirsts = groupElements(collectCertainFirstElements);
    const groupLasts = groupElements(collectCertainLastElements);

    // most wins, optimize, repeat
    const maxFirstsEqual = countSame(groupFirsts);
    const maxLastsEqual = countSame(groupLasts);
    if (Math.max(maxFirstsEqual, maxLastsEqual) > 1) {
      const beforeChoices = [];
      const afterChoices = [];
      if (maxFirstsEqual >= maxLastsEqual) {
        const firstElement = Object.entries(groupFirsts).find(
          ([, value]) => value === maxFirstsEqual
        )[0];

        // now filter all choices that have this as first element, placing
        // the others in 'leftOverChoices'
        let hasEmpty = false;
        let found = false;
        const newChoices = collectCertainFirstElements
          .map((elem, index) => {
            // if not match, add production choice to leftOverChoices.
            if (JSON.stringify(elem) === firstElement) {
              found = true;
              // strip off element of chain.
              const choice = current.choice[index];
              if (choice.sequence) {
                return { ...choice, sequence: choice.sequence.slice(1) };
              } else {
                hasEmpty = true;
              }
            } else {
              (found ? afterChoices : beforeChoices).push(
                current.choice[index]
              );
            }
          })
          .filter(Boolean);
        const newElements = [
          JSON.parse(firstElement),
          newChoices.length > 0 &&
            hasEmpty && {
              optional:
                newChoices.length == 1 ? newChoices[0] : { choice: newChoices },
            },
          newChoices.length > 0 &&
            !hasEmpty &&
            (newChoices.length == 1 ? newChoices[0] : { choice: newChoices }),
        ].filter(Boolean);
        const replacementElement =
          newElements.length > 1 ? { sequence: newElements } : newElements[0];

        const finalResult =
          beforeChoices.length + afterChoices.length > 0
            ? {
                choice: []
                  .concat(beforeChoices)
                  .concat(replacementElement)
                  .concat(afterChoices),
              }
            : replacementElement;

        return finalResult;
      } else {
        const lastElement = Object.entries(groupLasts).find(
          ([, value]) => value === maxLastsEqual
        )[0];

        // now filter all choices that have this as first element, placing
        // the others in 'leftOverChoices'
        let hasEmpty = false;
        let found = false;
        const newChoices = collectCertainLastElements
          .map((elem, index) => {
            // if not match, add production choice to leftOverChoices.
            if (JSON.stringify(elem) === lastElement) {
              found = true;
              // strip off element of chain.
              const choice = current.choice[index];
              if (choice.sequence) {
                return { ...choice, sequence: choice.sequence.slice(0, -1) };
              } else {
                hasEmpty = true;
              }
            } else {
              (found ? afterChoices : beforeChoices).push(
                current.choice[index]
              );
            }
          })
          .filter(Boolean);
        const newElements = [
          newChoices.length > 0 &&
            hasEmpty && {
              optional:
                newChoices.length == 1 ? newChoices[0] : { choice: newChoices },
            },
          newChoices.length > 0 &&
            !hasEmpty &&
            (newChoices.length == 1 ? newChoices[0] : { choice: newChoices }),
          JSON.parse(lastElement),
        ].filter(Boolean);
        const replacementElement =
          newElements.length > 1 ? { sequence: newElements } : newElements[0];

        const finalResult =
          beforeChoices.length + afterChoices.length > 0
            ? {
                choice: []
                  .concat(beforeChoices)
                  .concat(replacementElement)
                  .concat(afterChoices),
              }
            : replacementElement;

        return finalResult;
      }
    }

    // Merge remaining choices
    const result = {
      ...current,
      choice: skipFirst(
        current.choice
          .map((item) => {
            const optimizedItem = item;
            if (optimizedItem.choice) {
              return optimizedItem.choice;
            } else {
              return [optimizedItem];
            }
          })
          .reduce((acc, item) => acc.concat(item), [])
      ),
    };
    if (equalElements(result, current)) {
      return current;
    }
    return result;
  },
};
