import BpmnModdle from 'bpmn-moddle';

import { diff } from 'bpmn-js-differ';

export async function diffXML(xml, otherXml) {
  const moddle = new BpmnModdle();

  const { rootElement: localDefinitions} = await moddle.fromXML(xml);
  const { rootElement: remoteDefinitions} = await moddle.fromXML(otherXml);

  return diff(localDefinitions, remoteDefinitions);
}