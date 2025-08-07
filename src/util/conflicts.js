import { diffXML } from "./diff";
/**
 * Find conflicts between local, and remote BPMN files based on a base BPMN
 * file. This is an alternative to Git's default three-way merge algorithm.
 * See https://git-scm.com/docs/merge-strategies#Documentation/merge-strategies.txt-ort
 *
 * @param {string} baseXml 
 * @param {string} localXml 
 * @param {string} remoteXml 
 *
 * @return {Promise<Object>} A promise that resolves to an object containing conflicts.
 */
export async function findConflicts(baseXml, localXml, remoteXml) {
  const localDiff = await diffXML(baseXml, localXml);
  const remoteDiff = await diffXML(baseXml, remoteXml);

  console.log('Local Diff:', localDiff);
  console.log('Remote Diff:', remoteDiff);

  const conflicts = [];

  /**
   * Conflicting layout changes.
   * If both local and remote have layout changes for the same element,
   * it is considered a conflict.
   */
  for (const id in localDiff._layoutChanged) {
    if (remoteDiff._layoutChanged[id]) {
      conflicts.push({
        id,
        type: 'layout-changed',
        a: localDiff._layoutChanged[id],
        b: remoteDiff._layoutChanged[id]
      });
    }
  }

  for (const id in remoteDiff._layoutChanged) {
    if (localDiff._layoutChanged[id] && !conflicts.some(conflict => conflict.id === id && conflict.type === 'layout-changed')) {
      conflicts.push({
        id,
        type: 'layout-changed',
        a: localDiff._layoutChanged[id],
        b: remoteDiff._layoutChanged[id]
      });
    }
  }

  /**
   * Conflicting additions.
   * If an element with the same ID is added in both local and remote,
   * it is considered a conflict.
   */
  for (const id in localDiff._added) {
    if (remoteDiff._added[id]) {
      conflicts.push({
        id,
        type: 'added',
        a: localDiff._added[id],
        b: remoteDiff._added[id]
      });
    }
  }

  for (const id in remoteDiff._added) {
    if (localDiff._added[id] && !conflicts.some(conflict => conflict.id === id && conflict.type === 'added')) {
      conflicts.push({
        id,
        type: 'added',
        a: localDiff._added[id],
        b: remoteDiff._added[id]
      });
    }
  }

  return conflicts;
}