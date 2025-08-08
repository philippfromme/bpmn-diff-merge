import BpmnModdle from 'bpmn-moddle';

import zeebe from 'zeebe-bpmn-moddle/resources/zeebe.json' with { type: 'json' };

import { get, set } from 'min-dash';

import { diffXML  } from './diff';
import { is } from 'bpmn-js/lib/util/ModelUtil';

export async function merge(baseXML, localDiff, remoteDiff, conflicts, conflictDecisions) {
  const moddle = new BpmnModdle({ zeebe});

  const { rootElement: baseDefinitions} = await moddle.fromXML(baseXML);

  // apply property changes
  for (const elementId in localDiff._changed) {
    for (const property in localDiff._changed[elementId].properties) {

      const localChange = localDiff._changed[elementId].properties[property];

      const { conflictId } = localChange;

      if (conflictId) {
        const remoteChange = remoteDiff._changed[elementId].properties[property];

        const decision = conflictDecisions[conflictId];

        if (decision === 'a') {
          console.log(`Applying local change for ${elementId} property ${property}:`, localChange.newValue);

          const path = localChange.path;

          const moddleElement = findFlowElement(baseDefinitions, elementId);

          set(moddleElement, path, localChange.newValue);
        } else if (decision === 'b') {
          console.log(`Applying remote change for ${elementId} property ${property}:`, remoteChange.newValue);

          const path = remoteChange.path;

          const moddleElement = findFlowElement(baseDefinitions, elementId);

          set(moddleElement, path, remoteChange.newValue);
        }
      }
    }
  }

  const { xml: mergedXML } = await moddle.toXML(baseDefinitions, { format: true });

  return mergedXML;
}

function replaceDI(oldDefinitions, newDefinitions, element) {
  const id = element.id;

  for (const diagram of oldDefinitions.diagrams) {
    for (const planeElement of diagram.plane.planeElement) {
      if (planeElement.bpmnElement?.id === id) {
        
        let newDI;

        for (const newDiagram of newDefinitions.diagrams) {
          for (const newPlaneElement of newDiagram.plane.planeElement) {
            if (newPlaneElement.bpmnElement?.id === id) {
              newDI = newPlaneElement;
              break;
            }
          }
        }

        if (newDI) {
          console.log('Replacing DI for element:', id);

          if (is(planeElement, 'bpmndi:BPMNShape')) {
            planeElement.bounds = newDI.bounds;
          } else if (is(planeElement, 'bpmndi:BPMNEdge')) {
            planeElement.waypoint = newDI.waypoint;
          } else {
            console.warn('Unknown DI type for element:', id);
          }
        } else {
          console.warn('No new DI found for element:', id);
        }
      }
    }
  }
}

function findFlowElement(moddleElement, elementId) {
  if (moddleElement.get('id') === elementId) {
    return moddleElement;
  }

  if (moddleElement.rootElements) {
    for (const rootElement of moddleElement.rootElements) {
      const foundElement = findFlowElement(rootElement, elementId);
      if (foundElement) {
        return foundElement;
      }
    }
  }

  if (moddleElement.flowElements) {
    for (const flowElement of moddleElement.flowElements) {
      const foundElement = findFlowElement(flowElement, elementId);
      if (foundElement) {
        return foundElement;
      }
    }
  }

  return null;
}