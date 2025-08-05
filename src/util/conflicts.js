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
  const baseDiff = await diffXML(baseXml, localXml);
  const remoteDiff = await diffXML(baseXml, remoteXml);

  const conflicts = {
    added: [],
    removed: [],
    changed: []
  };

  // Check for added elements in local that are not in remote
  Object.values(baseDiff._added).forEach(element => {
    if (!Object.values(remoteDiff._added).find(e => e.id === element.id)) {
      conflicts.added.push(element);
    }
  });

  // Check for removed elements in local that are not in remote
  Object.values(baseDiff._removed).forEach(element => {
    if (!Object.values(remoteDiff._removed).find(e => e.id === element.id)) {
      conflicts.removed.push(element);
    }
  });

  // Check for changed elements in local that are not in remote
  Object.values(baseDiff._changed).forEach(element => {
    if (!Object.values(remoteDiff._changed).find(e => e.id === element.id)) {
      conflicts.changed.push(element);
    }
  });

  return conflicts;
}