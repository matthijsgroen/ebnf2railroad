const skipFirst = list =>
  [
    list.some(e => e === "skip") && { skip: true },
    ...list.filter(e => e !== "skip")
  ].filter(Boolean);

const ungroup = elem => (elem.group ? ungroup(elem.group) : elem);

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
    return {
      ...production,
      choice: skipFirst(
        production.choice
          .map((item, idx, list) => {
            const optimizedItem = optimizeProduction(item);
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
            } else {
              return [optimizedItem];
            }
          })
          .reduce((acc, item) => acc.concat(item), [])
          .filter((item, index, list) => list.indexOf(item) === index)
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
            return {
              clearPrevious: matches.length,
              repetition: { sequence: matches },
              repeater: {
                sequence: subSequence.slice(0, -matches.length).reverse()
              },
              skippable: false
            };
          }
        }
      }
      return optimizeProduction(item);
    };

    const vacuumResults = (elem, index, list) => {
      if (!elem) return false;
      let ahead = 1;
      if (elem.clearPrevious) {
        elem.clearPrevious = 0;
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
    };
    return optimizedSequence;
  }
  if (production.repetition) {
    return {
      ...production,
      repetition: optimizeProduction(production.repetition)
    };
  }
  if (production.optional) {
    return {
      ...production,
      optional: optimizeProduction(production.optional)
    };
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
