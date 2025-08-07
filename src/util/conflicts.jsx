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
  for (const elementId in localDiff._layoutChanged) {
    if (remoteDiff._layoutChanged[elementId]) {
      conflicts.push({
        label: getLabel(localDiff._layoutChanged[elementId]),
        elementId: elementId,
        typeA: 'layout-changed',
        typeB: 'layout-changed',
        a: localDiff._layoutChanged[elementId],
        b: remoteDiff._layoutChanged[elementId],
        description: <span>Element has layout changes in both local and remote versions.</span>
      });
    }
  }

  /**
   * Conflicting additions.
   * If an element with the same ID is added in both local and remote,
   * it is considered a conflict.
   */
  for (const elementId in localDiff._added) {
    if (remoteDiff._added[elementId]) {
      conflicts.push({
        label: getLabel(localDiff._added[elementId]),
        elementId: elementId,
        typeA: 'added',
        typeB: 'added',
        a: localDiff._added[elementId],
        b: remoteDiff._added[elementId],
        description: <span>Element is added in both local and remote versions.</span>
      });
    }
  }

  /**
   * Conflicting property changes.
   * If an element has different properties in local and remote,
   * it is considered a conflict.
   */
  for (const elementId in localDiff._changed) {
    if (remoteDiff._changed[elementId]) {
      for (const property in localDiff._changed[elementId].properties) {
        if (pathEquals(localDiff._changed[elementId].properties[property].path, remoteDiff._changed[elementId].properties[property].path)) {
          conflicts.push({
            label: getLabel(localDiff._changed[elementId].model),
            elementId: elementId,
            typeA: 'changed',
            typeB: 'changed',
            a: localDiff._changed[elementId].properties[property],
            b: remoteDiff._changed[elementId].properties[property],
            description: <div>
              <span>Element has conflicting property changes for <code>{pathStringify(localDiff._changed[elementId].properties[property].path)}</code>.</span>
              <div className="comparison">
                <div className="local">
                  <pre>{localDiff._changed[elementId].properties[property].newValue}</pre>
                </div>
                <div className="remote">
                  <pre>{remoteDiff._changed[elementId].properties[property].newValue}</pre>
                </div>
              </div>
            </div>
          });
        }
      }
    }
  }

  /**
   * Conflicting change with removal.
   * If an element is removed in one version and changed in another,
   * it is considered a conflict.
   */
  for (const elementId in localDiff._removed) {
    if (remoteDiff._changed[elementId]) {
      conflicts.push({
        label: getLabel(localDiff._removed[elementId]),
        elementId: elementId,
        typeA: 'removed',
        typeB: 'changed',
        a: localDiff._removed[elementId],
        b: remoteDiff._changed[elementId].model,
        description: <div>
          <span>Element is removed in local version but changed in remote version.</span>
        </div>
      });
    }
  }

  // check the reverse for remote removed and local changed
  for (const elementId in remoteDiff._removed) {
    if (localDiff._changed[elementId]) {
      conflicts.push({
        label: getLabel(remoteDiff._removed[elementId]),
        elementId: elementId,
        typeA: 'changed',
        typeB: 'removed',
        a: remoteDiff._removed[elementId],
        b: localDiff._changed[elementId].model,
        description: <div>
          <span>Element is removed in remote version but changed in local version.</span>
        </div>
      });
    }
  }

  return conflicts.map(conflict => ({
    ...conflict,
    id: getRandomId()
  }));
}

function getRandomId() {
  return Math.random().toString(36).substring(2, 15);
}

function getLabel(element) {
  if (element.name) {
    return element.name + (element.id ? ` (${element.id})` : '');
  } else if (element.id) {
    return element.id;
  } else {
    return 'Unnamed Element';
  }
}

const {
  isNil,
  isString,
  isUndefined
} = require('min-dash');

/**
 * Get path from model element and optional parent model element. Fall back to
 * returning null.
 *
 * @param {ModdleElement} moddleElement
 * @param {ModdleElement} [parentModdleElement]
 *
 * @returns {string[]|null}
 */
function getPath(moddleElement, parentModdleElement) {
  if (!moddleElement) {
    return null;
  }

  if (moddleElement === parentModdleElement) {
    return [];
  }

  let path = [],
      parent;

  do {
    parent = moddleElement.$parent;

    if (!parent) {
      if (moddleElement.$instanceOf('bpmn:Definitions')) {
        break;
      } else {
        return null;
      }
    }

    path = [ ...getPropertyName(moddleElement, parent), ...path ];

    moddleElement = parent;

    if (parentModdleElement && moddleElement === parentModdleElement) {
      break;
    }
  } while (parent);

  return path;
};

/**
 * Get property name from model element and parent model element.
 *
 * @param {ModdleElement} moddleElement
 * @param {ModdleElement} parentModdleElement
 *
 * @returns {string[]}
 */
function getPropertyName(moddleElement, parentModdleElement) {
  for (let property of Object.values(parentModdleElement.$descriptor.propertiesByName)) {
    if (property.isMany) {
      if (parentModdleElement.get(property.name).includes(moddleElement)) {
        return [
          property.name,
          parentModdleElement.get(property.name).indexOf(moddleElement)
        ];
      }
    } else {
      if (parentModdleElement.get(property.name) === moddleElement) {
        return [ property.name ];
      }
    }
  }

  return [];
}

/**
 * @param {(string|(number|string)[])[]} paths
 *
 * @returns {(number|string)[]}
 */
function pathConcat(...paths) {
  let concatenatedPaths = [];

  for (let path of paths) {
    if (isNil(path) || isUndefined(path)) {
      return null;
    }

    if (isString(path)) {
      path = [ path ];
    }

    concatenatedPaths = concatenatedPaths.concat(path);
  }

  return concatenatedPaths;
};

/**
 * @param {string|(number|string)[]} a
 * @param {string|(number|string)[]} b
 * @param {string} [separator]
 *
 * @returns {boolean}
 */
function pathEquals(a, b, separator = '.') {
  if (isNil(a) || isUndefined(a) || isNil(b) || isUndefined(b)) {
    return false;
  }

  if (!isString(a)) {
    a = pathStringify(a, separator);
  }

  if (!isString(b)) {
    b = pathStringify(b, separator);
  }

  return a === b;
};

/**
 * @param {string} path
 * @param {string} [separator]
 *
 * @returns {(number|string)[]}
 */
function pathParse(path, separator = '.') {
  if (isNil(path) || isUndefined(path)) {
    return null;
  }

  return path
    .split(separator)
    .map(string => isNaN(string) ? string : parseInt(string));
};

/**
 * @param {(number|string)[]} path
 * @param {string} [separator]
 *
 * @returns {string}
 */
function pathStringify(path, separator = ' > ') {
  if (isNil(path) || isUndefined(path)) {
    return null;
  }

  return path.join(separator);
}