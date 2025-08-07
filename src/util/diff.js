import BpmnModdle from 'bpmn-moddle';

import { diff } from 'bpmn-js-differ';

import zeebe from 'zeebe-bpmn-moddle/resources/zeebe.json' with { type: 'json' };

export async function diffXML(xml, otherXml) {
  const moddle = new BpmnModdle({ zeebe});

  const { rootElement: localDefinitions} = await moddle.fromXML(xml);
  const { rootElement: remoteDefinitions} = await moddle.fromXML(otherXml);

  return diff(localDefinitions, remoteDefinitions);
}