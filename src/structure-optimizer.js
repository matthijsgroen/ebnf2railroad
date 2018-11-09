const skipFirst = list =>
  [
    list.some(e => e === "skip" || e.skip) && { skip: true },
    ...list.filter(e => e !== "skip" && !e.skip)
  ].filter(Boolean);

const ungroup = elem =>
  elem.group && !elem.comment ? ungroup(elem.group) : elem;

const equalElements = (first, second) =>
  JSON.stringify(ungroup(first)) === JSON.stringify(ungroup(second));

const optimizeProduction = production => {
  if (production.definition) {
    return {
      ...production,
      definition: optimizeProduction(production.definition)
    };
  }
  if (production.choice) {
    // Check if rewrites are possible.
    const allChoicesTheSame = production.choice
      .map(elem => ungroup(optimizeProduction(elem)))
      .every((item, idx, list) => equalElements(item, list[0]));
    if (allChoicesTheSame) {
      return ungroup(optimizeProduction(production.choice[0]));
    }

    const isCertain = elem =>
      (elem.terminal && elem) || (elem.nonTerminal && elem);

    const groupElements = elements => {
      const allSet = elements.every(f => f);
      if (!allSet) return {};
      return elements.reduce((acc, elem) => {
        const key = JSON.stringify(elem);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
    };
    const countSame = groupElements => {
      const amounts = Object.values(groupElements);
      return Math.max(...amounts);
    };

    const collectCertainFirstElements = production.choice.map(
      elem =>
        isCertain(elem) ||
        (elem.sequence && isCertain(optimizeProduction(elem.sequence[0])))
    );
    const collectCertainLastElements = production.choice.map(
      elem =>
        isCertain(elem) ||
        (elem.sequence && isCertain(elem.sequence[elem.sequence.length - 1]))
    );
    const groupFirsts = groupElements(collectCertainFirstElements);
    const groupLasts = groupElements(collectCertainLastElements);

    // most wins, optimize, repeat
    const maxFirstsEqual = countSame(groupFirsts);
    const maxLastsEqual = countSame(groupLasts);
    if (Math.max(maxFirstsEqual, maxLastsEqual) > 1) {
      if (maxFirstsEqual >= maxLastsEqual) {
        const leftOverChoices = [];

        const firstElement = Object.entries(groupFirsts).find(
          ([, value]) => value === maxFirstsEqual
        )[0];

        // now filter all choices that have this as first element, placing
        // the others in 'leftOverChoices'
        let hasEmpty = false;
        const newChoices = collectCertainFirstElements
          .map((elem, index) => {
            // if not match, add production choice to leftOverChoices.
            if (JSON.stringify(elem) === firstElement) {
              // strip off element of chain.
              const choice = production.choice[index];
              if (choice.sequence) {
                return { ...choice, sequence: choice.sequence.slice(1) };
              } else {
                hasEmpty = true;
              }
            } else {
              leftOverChoices.push(production.choice[index]);
            }
          })
          .filter(Boolean);
        const newElements = [
          JSON.parse(firstElement),
          newChoices.length > 0 &&
            hasEmpty && {
              optional:
                newChoices.length == 1 ? newChoices[0] : { choice: newChoices }
            },
          newChoices.length > 0 &&
            !hasEmpty &&
            (newChoices.length == 1 ? newChoices[0] : { choice: newChoices })
        ].filter(Boolean);
        const replacementElement =
          newElements.length > 1 ? { sequence: newElements } : newElements[0];

        const finalResult =
          leftOverChoices.length > 0
            ? { choice: [replacementElement].concat(leftOverChoices) }
            : replacementElement;

        return optimizeProduction(finalResult);
      } else {
        const leftOverChoices = [];

        const lastElement = Object.entries(groupLasts).find(
          ([, value]) => value === maxLastsEqual
        )[0];

        // now filter all choices that have this as first element, placing
        // the others in 'leftOverChoices'
        let hasEmpty = false;
        const newChoices = collectCertainLastElements
          .map((elem, index) => {
            // if not match, add production choice to leftOverChoices.
            if (JSON.stringify(elem) === lastElement) {
              // strip off element of chain.
              const choice = production.choice[index];
              if (choice.sequence) {
                return { ...choice, sequence: choice.sequence.slice(0, -1) };
              } else {
                hasEmpty = true;
              }
            } else {
              leftOverChoices.push(production.choice[index]);
            }
          })
          .filter(Boolean);
        const newElements = [
          newChoices.length > 0 &&
            hasEmpty && {
              optional:
                newChoices.length == 1 ? newChoices[0] : { choice: newChoices }
            },
          newChoices.length > 0 &&
            !hasEmpty &&
            (newChoices.length == 1 ? newChoices[0] : { choice: newChoices }),
          JSON.parse(lastElement)
        ].filter(Boolean);
        const replacementElement =
          newElements.length > 1 ? { sequence: newElements } : newElements[0];

        const finalResult =
          leftOverChoices.length > 0
            ? { choice: [replacementElement].concat(leftOverChoices) }
            : replacementElement;

        return optimizeProduction(finalResult);
      }
    }

    // Merge remaining choices
    return {
      ...production,
      choice: skipFirst(
        production.choice
          .map(item => {
            const optimizedItem = ungroup(optimizeProduction(item));
            if (optimizedItem.repetition && optimizedItem.skippable) {
              return [
                "skip",
                {
                  ...optimizedItem,
                  skippable: false
                }
              ];
            } else if (optimizedItem.optional) {
              return ["skip", optimizedItem.optional];
            } else if (optimizedItem.choice) {
              return optimizedItem.choice;
            } else {
              return [optimizedItem];
            }
          })
          .reduce((acc, item) => acc.concat(item), [])
          .map(e => JSON.stringify(e))
          .filter((item, index, list) => list.indexOf(item) === index)
          .map(e => JSON.parse(e))
      )
    };
  }
  if (production.sequence) {
    const optimizeStructure = (item, idx, list) => {
      if (item.repetition && idx > 0) {
        if (!item.repetition.sequence) {
          const lastElem = item.repetition;
          const previousElem = list[idx - 1];
          if (equalElements(lastElem, previousElem)) {
            return {
              clearPrevious: 1,
              repetition: lastElem,
              skippable: false
            };
          }
        } else {
          const subSequence = item.repetition.sequence;
          const matches = [];

          let keepLooking = true;
          let lookBack = 1;
          do {
            const lastSequenceElem = subSequence[subSequence.length - lookBack];
            const previousElem = list[idx - lookBack];

            if (
              lastSequenceElem &&
              previousElem &&
              equalElements(lastSequenceElem, previousElem)
            ) {
              matches.push(lastSequenceElem);
            } else {
              keepLooking = false;
            }
            lookBack++;
          } while (keepLooking);

          if (matches.length > 0) {
            const repeaterSequence = subSequence
              .slice(0, -matches.length)
              .reverse();

            const resultObject = {
              clearPrevious: matches.length,
              repetition: { sequence: matches.reverse() },
              skippable: false
            };

            if (repeaterSequence.length > 0) {
              const repeater =
                repeaterSequence.length > 1
                  ? { sequence: repeaterSequence }
                  : repeaterSequence[0];
              resultObject.repeater = repeater;
            }
            return resultObject;
          }
        }
      }
      return optimizeProduction(item);
    };

    const vacuumResults = (elem, index, list) => {
      if (!elem) return false;
      let ahead = 1;
      if (elem.clearPrevious) {
        delete elem["clearPrevious"];
      }
      while (list[ahead + index] !== undefined) {
        const item = list[ahead + index];
        if (item.clearPrevious && item.clearPrevious >= ahead) {
          return false;
        }
        ahead += 1;
      }
      return true;
    };

    const optimizedSequence = {
      ...production,
      sequence: production.sequence
        // pass 1: unpack comments
        .map(
          item =>
            item.comment ? [item.group, { comment: item.comment }] : [item]
        )
        .reduce((acc, item) => acc.concat(item), [])
        // pass 2: optimize structure
        .map(optimizeStructure)
        .filter(vacuumResults)
        .map(elem => (elem.sequence ? elem.sequence : [elem]))
        .reduce((acc, elem) => acc.concat(elem), [])
    };
    return optimizedSequence.sequence.length == 1
      ? optimizedSequence.sequence[0]
      : optimizedSequence;
  }
  if (production.repetition) {
    return {
      ...production,
      repetition: optimizeProduction(production.repetition)
    };
  }
  if (production.optional) {
    if (production.optional.choice) {
      return optimizeProduction({
        ...production.optional,
        choice: [{ skip: true }, ...production.optional.choice]
      });
    } else {
      return {
        ...production,
        optional: optimizeProduction(production.optional)
      };
    }
  }
  if (production.group) {
    return {
      ...production,
      group: optimizeProduction(production.group)
    };
  }
  return production;
};

module.exports = {
  optimizeProduction
};
