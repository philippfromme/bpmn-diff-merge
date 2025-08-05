import Viewer from 'bpmn-js/lib/NavigatedViewer.js';

import ElementColors from '../util/features/element-colors';

import { diffXML } from '../util/diff.js';
import { syncViewboxes } from '../util/sync.js';

import './styles.css';

import AddIcon from '../icons/add.svg';
import EditIcon from '../icons/edit.svg';
import FlowDataIcon from '../icons/flow--data.svg';
import SubtractIcon from '../icons/subtract.svg';

async function importXML(xml, container, viewbox) {
  const viewer = new Viewer({
    container,
    additionalModules: [
      ElementColors
    ]
  });

  try {
    await viewer.importXML(xml);

    const { inner } = viewer.get("canvas").viewbox();

    if (viewbox) {
      viewer.get('canvas').viewbox(viewbox);
    } else {
      viewer.get("canvas").zoom("fit-viewport", {
        x: inner.x + inner.width / 2,
        y: inner.y + inner.height / 2
      });
    }


    return viewer;
  } catch (error) {
    console.error('Error importing XML:', error);
  }
}

async function init() {
  document.querySelector('#local .title .path').textContent = window.localPath;
  document.querySelector('#remote .title .path').textContent = window.remotePath;

  const diffResult = await diffXML(window.localXml, window.remoteXml);

  console.log(diffResult);

  const localViewer = await importXML(window.localXml, '#local .container');

  const localViewerViewbox = localViewer.get('canvas').viewbox();

  const remoteViewer = await importXML(window.remoteXml, '#remote .container', localViewerViewbox);

  const { _removed: removedElements, _added: addedElements, _changed: changedElements, _layoutChanged: layoutChangedElements } = diffResult;

  const markerProperties = {
    added: {
      icon: AddIcon,
      className: 'added',
      strokeColor: '#1da04e',
      fillColor: '#a5efbc'
    },
    changed: {
      icon: EditIcon,
      className: 'changed',
      strokeColor: '#1f64f9',
      fillColor: '#d0e2fd'
    },
    'layout-changed': {
      icon: FlowDataIcon,
      className: 'layout-changed',
      strokeColor: '#1f64f9',
      fillColor: '#d0e2fd'
    },
    removed: {
      icon: SubtractIcon,
      className: 'removed',
      strokeColor: '#db242f',
      fillColor: '#ffd7d9'
    }
  }

  const addMarkers = (moddleElement, markers, viewer) => {
    const elementRegistry = viewer.get('elementRegistry');

    const element = elementRegistry.get(moddleElement.get('id'));

    markers.forEach((marker, index) => {
      const { icon, className, strokeColor, fillColor } = markerProperties[marker];

      if (element) {
        viewer.get('overlays').add(element, {
          position: {
            top: -12,
            left: -12 * index
          },
          html: `<div class="overlay ${className}">${icon}</div>`
        });

        console.log('Adding marker', element.id, className, strokeColor, fillColor);

        viewer.get('elementColors').add(element, `diff-${className}`, {
          stroke: strokeColor,
          fill: fillColor
        });
      }
    });
  }

  for (const element of Object.values(removedElements)) {
    addMarkers(element, ['removed'], localViewer);
  }

  for (const element of Object.values(addedElements)) {
    addMarkers(element, ['added'], remoteViewer);
  }

  for (const { model: element} of Object.values(changedElements)) {
    addMarkers(element, ['changed'], localViewer);
    addMarkers(element, ['changed'], remoteViewer);
  }

  for (const element of Object.values(layoutChangedElements)) {
    addMarkers(element, ['layout-changed'], localViewer);
    addMarkers(element, ['layout-changed'], remoteViewer);
  }

  syncViewboxes(localViewer, remoteViewer);
}

document.addEventListener('DOMContentLoaded', init);