import React, { useEffect, useRef } from 'react';

import {
  Accordion,
  AccordionItem,
  HeaderContainer,
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuButton,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
} from '@carbon/react';

import {
  Add,
  Subtract,
  Edit,
  FlowData,
  PullRequest
} from '@carbon/icons-react';

import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer.js';

import classNames from 'classnames';

import ResizableContainer from './ResizableContainer.jsx';

import { findConflicts } from '../util/conflicts';

export default function App() {

  const [ conflicts, setConflicts ] = React.useState([]);

  useEffect(() => {
    findConflicts(window.baseXml, window.localXml, window.remoteXml).then(conflicts => {
      setConflicts(conflicts);

      console.log('Conflicts:', conflicts);
    });
  }, []);

  return (
    <>
      <HeaderContainer
        render={({ isSideNavExpanded, onClickSideNavExpand }) => (
          <Header aria-label="BPMN Merge Tool">
            <HeaderName href="/" prefix="">
              <PullRequest width="24" height="24" className="header-icon"/> diagram.bpmn (8 conflicts)
            </HeaderName>
          </Header>
        )}
      />
      <div className="main">
        <ResizableContainer direction="right" initialSize={300} minSize={200} maxSize={400}>
          <div className="conflicts">
            {
              conflicts.map((conflict, index) => {
                const {
                  id,
                  type,
                  a,
                  b
                } = conflict;

                const Icon = getIcon(type);

                return <Accordion align="start" key={index}>
                  <AccordionItem title={<>{ Icon }{id}</>}>{type}</AccordionItem>
                </Accordion>;
              })
            }
          </div>
        </ResizableContainer>
        <div className="diagrams">
          <div className="top">
            <div className="left">
              <div className="diagram-title"><span className="letter">A</span><span className="title">Commit 987654 on main</span></div>
              <Diagram xml={window.localXml} />
            </div>
            <div className="right">
              <div className="diagram-title"><span className="letter">B</span><span className="title">Commit 123456 on feature</span></div>
              <Diagram xml={window.remoteXml} />
            </div>
          </div>
          <div className="bottom">
            <div className="diagram-title"><span className="title">Output</span></div>
            <Diagram xml={window.localXml} previousXml={window.baseXml} />
          </div>
        </div>
      </div>
    </>
  );
}

function Diagram(props) {
  const {
    className,
    xml,
    previousXml // optional, for diff
  } = props;

  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const viewer = new NavigatedViewer({
      container: ref.current,
      additionalModules: []
    });

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
  }, [xml, previousXml]);

  return (
    <div className={ classNames('diagram', className) } ref={ ref }>
    </div>
  );
}

function getIcon(type) {
  switch (type) {
    case 'added':
      return <Add />;
    case 'removed':
      return <Subtract />;
    case 'changed':
      return <Edit />;
    case 'layout-changed':
      return <FlowData />;
    default:
      return null;
  }
}