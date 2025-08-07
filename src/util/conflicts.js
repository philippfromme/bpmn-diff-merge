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

  for (const id in localDiff._layoutChanged) {
    if (remoteDiff._layoutChanged[id]) {
      conflicts.push({
        type: 'layout-changed',
        a: localDiff._layoutChanged[id],
        b: remoteDiff._layoutChanged[id]
      });
    }
  }

  return conflicts;
}