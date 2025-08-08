import React, { useEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer.js';

import ElementColors from '../util/features/element-colors';

import { diffXML } from '../util/diff.js';
import { syncViewboxes } from '../util/sync.js';

import {
  Add,
  Subtract,
  Edit,
  FlowData,
  PullRequest
} from '@carbon/icons-react';

import { createRoot } from 'react-dom/client';

import './styles.scss';

async function renderDiff(localViewer, remoteViewer) {
  const diffResult = await diffXML(window.localXml, window.remoteXml);

  console.log(diffResult);

  const { _removed: removedElements, _added: addedElements, _changed: changedElements, _layoutChanged: layoutChangedElements } = diffResult;

  const markerProperties = {
    added: {
      icon: `<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Adobe Illustrator 24.0.3, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<svg version="1.1" id="icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 width="32px" height="32px" viewBox="0 0 32 32" style="enable-background:new 0 0 32 32;" xml:space="preserve">
<style type="text/css">
	.st0{fill:none;}
</style>
<polygon points="17,15 17,8 15,8 15,15 8,15 8,17 15,17 15,24 17,24 17,17 24,17 24,15 "/>
<rect class="st0" width="32" height="32"/>
</svg>`,
      className: 'added',
      strokeColor: '#198038',
      fillColor: '#defbe6'
    },
    changed: {
      icon: `<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Adobe Illustrator 24.0.3, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<svg version="1.1" id="icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 width="32px" height="32px" viewBox="0 0 32 32" style="enable-background:new 0 0 32 32;" xml:space="preserve">
<style type="text/css">
	.st0{fill:none;}
</style>
<title>edit</title>
<rect x="2" y="26" width="28" height="2"/>
<path d="M25.4,9c0.8-0.8,0.8-2,0-2.8c0,0,0,0,0,0l-3.6-3.6c-0.8-0.8-2-0.8-2.8,0c0,0,0,0,0,0l-15,15V24h6.4L25.4,9z M20.4,4L24,7.6
	l-3,3L17.4,7L20.4,4z M6,22v-3.6l10-10l3.6,3.6l-10,10H6z"/>
<rect id="_Transparent_Rectangle_" class="st0" width="32" height="32"/>
</svg>
`,
      className: 'changed',
      strokeColor: '#4589ff',
      fillColor: '#edf5ff'
    },
    'layout-changed': {
      icon: `<svg id="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><style>.cls-1{fill:#000000;}.cls-2{fill:none;}</style></defs><title>flow--data</title><path class="cls-1" d="M20,23H11.86a4.17,4.17,0,0,0-.43-1L22,11.43A3.86,3.86,0,0,0,24,12a4,4,0,1,0-3.86-5H11.86a4,4,0,1,0,0,2h8.28a4.17,4.17,0,0,0,.43,1L10,20.57A3.86,3.86,0,0,0,8,20a4,4,0,1,0,3.86,5H20v3h8V20H20ZM8,10a2,2,0,1,1,2-2A2,2,0,0,1,8,10ZM24,6a2,2,0,1,1-2,2A2,2,0,0,1,24,6ZM8,26a2,2,0,1,1,2-2A2,2,0,0,1,8,26Zm14-4h4v4H22Z"/><rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-2" width="32" height="32"/></svg>`,
      className: 'layout-changed',
      strokeColor: '#b28600',
      fillColor: '#fcf4d6'
    },
    removed: {
      icon: `<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Adobe Illustrator 24.0.3, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<svg version="1.1" id="icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 width="32px" height="32px" viewBox="0 0 32 32" style="enable-background:new 0 0 32 32;" xml:space="preserve">
<style type="text/css">
	.st0{fill:none;}
</style>
<rect x="8" y="15" width="16" height="2"/>
<rect id="_x3C_Transparent_Rectangle_x3E_" class="st0" width="32" height="32"/>
</svg>
`,
      className: 'removed',
      strokeColor: '#da1e28',
      fillColor: '#fff1f1'
    }
  };

  const addMarkers = (moddleElement, markers, viewer, priority = 1000) => {
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

        viewer.get('elementColors').add(element, `diff-${className}`, {
          stroke: strokeColor,
          fill: fillColor
        }, priority);
      }
    });
  }

  // ordered by importance of the change, later changes override earlier ones
  for (const element of Object.values(layoutChangedElements)) {
    addMarkers(element, ['layout-changed'], localViewer);
    addMarkers(element, ['layout-changed'], remoteViewer);
  }

  for (const element of Object.values(removedElements)) {
    addMarkers(element, ['removed'], localViewer);
  }

  for (const element of Object.values(addedElements)) {
    addMarkers(element, ['added'], remoteViewer);
  }

  for (const { element} of Object.values(changedElements)) {
    addMarkers(element, ['changed'], localViewer, 2000);
    addMarkers(element, ['changed'], remoteViewer, 2000);
  }

  syncViewboxes(localViewer, remoteViewer);
}

let _viewBox = null;

function App() {

  const [localViewer, setLocalViewer] = useState(null);
  const [localImportDone, setLocalImportDone] = useState(false);
  const [remoteViewer, setRemoteViewer] = useState(null);
  const [remoteImportDone, setRemoteImportDone] = useState(false);

  useEffect(() => {
    let viewer = new NavigatedViewer({
      additionalModules: [
        ElementColors
      ]
    });

    setLocalViewer(viewer);

    viewer.on('import.done', () => {
      setLocalImportDone(true);
    });

    viewer = new NavigatedViewer({
      additionalModules: [
        ElementColors
      ]
    });

    setRemoteViewer(viewer);

    viewer.on('import.done', () => {
      setRemoteImportDone(true);
    });
  }, []);

  useEffect(() => {
    console.log('Local Viewer:', localViewer);
    console.log('Remote Viewer:', remoteViewer);
    console.log('Local Import Done:', localImportDone);
    console.log('Remote Import Done:', remoteImportDone);

    if (localViewer && remoteViewer && localImportDone && remoteImportDone) {
      renderDiff(localViewer, remoteViewer);
    }
  }, [localViewer, remoteViewer, localImportDone, remoteImportDone]);

  return <>
    <div id="local" className="diagram left">
      <div className="title">
        <div className="diagram-title"><span className="letter">A</span><span className="title">Commit 123456 on feature</span></div>
      </div>
      <Diagram xml={window.localXml} viewer={localViewer} writeViewBox={true} />
    </div>
    <div id="remote" className="diagram right">
      <div className="title">
        <div className="diagram-title"><span className="letter">B</span><span className="title">Commit 123456 on feature</span></div>
      </div>
      <Diagram xml={window.remoteXml} viewer={remoteViewer} readViewBox={true} />
    </div>
  </>;
}

function Diagram(props) {
  const {
    className,
    viewer,
    xml,
    writeViewBox,
    readViewBox
  } = props;

  const ref = useRef(null);

  useEffect(() => {
    if (!viewer || !ref.current) return;

    viewer.attachTo(ref.current);

    viewer.importXML(xml).then(() => {

      if (readViewBox && _viewBox) {
        viewer.get('canvas').viewbox(_viewBox);

        return;
      }

      viewer.get('canvas').zoom('fit-viewport');

      const { inner } = viewer.get("canvas").viewbox();

      viewer.get("canvas").zoom("fit-viewport", {
        x: inner.x + inner.width / 2,
        y: inner.y + inner.height / 2
      });

      const padding = 20; // Add padding to the viewbox

      const viewbox = viewer.get('canvas').viewbox();

      viewer.get('canvas').viewbox({
        ...viewbox,
        x: viewbox.x - padding,
        y: viewbox.y - padding,
        width: viewbox.width + padding * 2,
        height: viewbox.height + padding * 2
      });

      if (writeViewBox) {
        _viewBox = viewer.get('canvas').viewbox();
      }
    }).catch(err => {
      console.error('Error importing XML:', err);
    });
  }, [viewer, xml]);

  return (
    <div className={ classNames('diagram', className) } ref={ ref }>
    </div>
  );
}

const container = document.getElementById('root');

const root = createRoot(container);

root.render(<App />);