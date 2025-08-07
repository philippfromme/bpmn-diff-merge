import React, { useEffect, useRef } from 'react';

import {
  Accordion,
  AccordionItem,
  ContentSwitcher,
  ExpandableTile,
  Switch,
  HeaderContainer,
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuButton,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
  Tile,
  TileAboveTheFoldContent,
  TileBelowTheFoldContent,
  Button,
  TextInput
} from '@carbon/react';

import {
  Add,
  Subtract,
  Edit,
  FlowData,
  PullRequest
} from '@carbon/icons-react';

import Viewer from 'bpmn-js/lib/Viewer.js';
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer.js';

import ElementColors from '../util/features/element-colors';

import classNames from 'classnames';

import ResizableContainer from './ResizableContainer.jsx';

import { findConflicts } from '../util/conflicts';

export default function App() {

  const [ localViewer, setLocalViewer ] = React.useState(null);
  const [ remoteViewer, setRemoteViewer ] = React.useState(null);
  const [ localImportDone, setLocalImportDone ] = React.useState(false);
  const [ remoteImportDone, setRemoteImportDone ] = React.useState(false);

  const [ mergedViewer, setMergedViewer ] = React.useState(null);

  const [ conflicts, setConflicts ] = React.useState([]);

  const [ conflictDecisions, setConflictDecisions ] = React.useState({});

  const [ selectedConflict, setSelectedConflict ] = React.useState(null);

  const [ hoveredConflict, setHoveredConflict ] = React.useState(null);

  useEffect(() => {
    let viewer = new Viewer({
      additionalModules: [
        ElementColors
      ]
    });

    setLocalViewer(viewer);

    viewer.on('import.done', () => {
      setLocalImportDone(true);
    });

    viewer = new Viewer({
      additionalModules: [
        ElementColors
      ]
    });

    setRemoteViewer(viewer);

    viewer.on('import.done', () => {
      setRemoteImportDone(true);
    });

    viewer = new NavigatedViewer({
      additionalModules: [
        ElementColors
      ]
    });

    setMergedViewer(viewer);
  }, []);

  const highlightConflictOnCanvas = (conflict) => {
    localViewer && highlightOnCanvas(localViewer, conflict, 'a');
    remoteViewer && highlightOnCanvas(remoteViewer, conflict, 'b');
  };

  useEffect(() => {
    findConflicts(window.baseXml, window.localXml, window.remoteXml).then(conflicts => {
      setConflicts(conflicts);

      console.log('Conflicts:', conflicts);
    });
  }, []);

  const remainingConflicts = conflicts.filter(c => !conflictDecisions[c.id]).length;

  return (
    <>
      <HeaderContainer
        render={({ isSideNavExpanded, onClickSideNavExpand }) => (
          <Header aria-label="BPMN Merge Tool">
            <HeaderName href="/" prefix="">
              <PullRequest width="20" height="20" className="header-icon"/> diagram.bpmn ({conflicts.length} conflicts)
            </HeaderName>
          </Header>
        )}
      />
      <div className="main">
        <ResizableContainer className="conflicts-container" direction="right" initialSize={400} minSize={300} maxSize={500}>
          <div className="conflicts">
            {
              conflicts.map((conflict, index) => {
                const {
                  id,
                  elementId,
                  label,
                  typeA,
                  typeB,
                  a,
                  b,
                  description
                } = conflict;

                const Icon = getIcon(typeA, typeB);

                return  <Tile
                  key={id}
                  onMouseEnter={() => setHoveredConflict(id)}
                  onMouseLeave={() => setHoveredConflict(null)}
                  onClick={() => {
                    setSelectedConflict(id);
                    highlightConflictOnCanvas(conflict);
                  }}
                  className={classNames('conflict', {
                    'conflict-hovered': hoveredConflict === id,
                    'conflict-selected': selectedConflict === id,
                    'conflict-a': conflictDecisions[id] === 'a',
                    'conflict-b': conflictDecisions[id] === 'b'
                  })}>
                  <div className="conflict-title">
                    <div className="conflict-title-left">{ Icon }{ label }</div>
                    <div className="conflict-title-right">
                      <Button className={classNames('button-a', {
                        'selected': conflictDecisions[id] === 'a'
                      })} onClick={() => {
                        setConflictDecisions(prev => ({ ...prev, [id]: 'a' }));
                      }}>A</Button>
                      <Button className={classNames('button-b', {
                        'selected': conflictDecisions[id] === 'b'
                      })} onClick={() => {
                        setConflictDecisions(prev => ({ ...prev, [id]: 'b' }));
                      }}>B</Button>
                    </div>
                  </div>

                  <div className="conflict-details">
                    {description}
                  </div>
                </Tile>;
              })
            }
          </div>
          <Button
            disabled={Object.keys(conflictDecisions).length !== conflicts.length}
            className="button-apply"
            onClick={() => {
              // Apply conflict decisions
              // applyConflictDecisions(conflictDecisions);
            }}
          >
            Apply Changes {remainingConflicts > 0 && `(${remainingConflicts} remaining)`}
          </Button>
        </ResizableContainer>
        <div className="diagrams">
          <div className="top">
            <div className="left">
              <div className="diagram-title"><span className="letter">A</span><span className="title">Commit 987654 on main</span></div>
              <Diagram xml={window.localXml} viewer={localViewer} />
            </div>
            <div className="right">
              <div className="diagram-title"><span className="letter">B</span><span className="title">Commit 123456 on feature</span></div>
              <Diagram xml={window.remoteXml} viewer={remoteViewer} />
            </div>
          </div>
          <div className="bottom">
            <div className="diagram-title"><span className="title">Output</span></div>
            <Diagram xml={window.localXml} previousXml={window.baseXml} viewer={mergedViewer} />
          </div>
        </div>
      </div>
    </>
  );
}

function Diagram(props) {
  const {
    viewer,
    className,
    xml,
    previousXml // optional, for diff
  } = props;

  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !viewer) return;

    viewer.attachTo(ref.current);

    viewer.importXML(xml).then(() => {
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
    }).catch(err => {
      console.error('Error importing XML:', err);
    });
  }, [viewer, xml, previousXml]);

  return (
    <div className={ classNames('diagram', className) } ref={ ref }>
    </div>
  );
}

// function getIcon(type) {
//   switch (type) {
//     case 'added':
//       return <Add />;
//     case 'removed':
//       return <Subtract />;
//     case 'changed':
//       return <Edit />;
//     case 'layout-changed':
//       return <FlowData />;
//     default:
//       return null;
//   }
// }


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

function getIcon(typeA, typeB) {
  const iconColorA = markerProperties[typeA]?.strokeColor || 'fuchsia';
  const iconColorB = markerProperties[typeB]?.strokeColor || 'fuchsia';

  return <div className="conflict-icon">
    <div className="conflict-icon-dot" style={{ backgroundColor: iconColorA }}></div>
    <div className="conflict-icon-dot" style={{ backgroundColor: iconColorB }}></div>
  </div>;
}

function highlightOnCanvas(viewer, conflict, side) {
  const elementId = conflict.elementId;

  const element = viewer.get('elementRegistry').get(elementId);

  if (!element) {
    console.warn(`Element with ID ${elementId} not found in viewer.`);
    return;
  }

  const type = side === 'a' ? conflict.typeA : conflict.typeB;

  const canvas = viewer.get('canvas');

  canvas.scrollToElement(element);

  viewer.get('elementColors').reset();

  viewer.get('elementColors').add(element, 'bpmn-merge',{
    fill: markerProperties[type]?.fillColor || 'fuchsia',
    stroke: markerProperties[type]?.strokeColor || 'fuchsia'
  });
}