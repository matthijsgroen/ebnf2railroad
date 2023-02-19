const { NodeTypes } = require("../ebnf-transform");

const equalElements = (first, second) =>
  JSON.stringify(first) === JSON.stringify(second);

const ungroup = (item) => (item.group && !item.comment ? item.group : item);

module.exports = {
  [NodeTypes.Sequence]: (current) => {
    if (!current.sequence) return current;
    const hasRepeats = current.sequence.some(
      (item) => item.repetition || (item.group && item.group.repetition)
    );
    if (!hasRepeats) return current;

    const optimizeStructure = (item, idx, list) => {
      if (item.repetition && idx > 0) {
        if (!item.repetition.sequence) {
          const lastElem = item.repetition;
          const previousElem = list[idx - 1];
          if (equalElements(ungroup(lastElem), ungroup(previousElem))) {
            return {
              clearPrevious: 1,
              repetition: ungroup(lastElem),
              skippable: false,
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
              skippable: false,
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
      return item;
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
      ...current,
      sequence: current.sequence
        // pass 1: unpack comments
        .map((item) =>
          item.comment && item.group && !item.group.optional
            ? item.before
              ? [{ comment: item.comment }, item.group]
              : [item.group, { comment: item.comment }]
            : [item]
        )
        .reduce((acc, item) => acc.concat(item), [])
        // pass 2: optimize structure
        .map(optimizeStructure)
        .filter(vacuumResults)
        .map((elem) => (elem.sequence ? elem.sequence : [elem]))
        .reduce((acc, elem) => acc.concat(elem), []),
    };
    if (equalElements(optimizedSequence, current)) {
      return current;
    }

    return optimizedSequence.sequence.length == 1
      ? optimizedSequence.sequence[0]
      : optimizedSequence;
  },
};
