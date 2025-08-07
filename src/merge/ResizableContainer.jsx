import classNames from 'classnames';
import React, { useState, useRef, useEffect } from 'react';

function ResizableContainer({ 
  direction = 'right', 
  initialSize = 300, 
  minSize = 100, 
  maxSize = 600, 
  children,
  onResize,
  className
}) {
  const [size, setSize] = useState(initialSize);
  const isResizing = useRef(false);

  const onMouseDown = (e) => {
    isResizing.current = true;
    e.preventDefault();
  };

  const onMouseMove = (e) => {
    if (!isResizing.current) return;
    let newSize;
    if (direction === 'right') {
      newSize = e.clientX;
    } else if (direction === 'left') {
      newSize = window.innerWidth - e.clientX;
    } else if (direction === 'top') {
      newSize = window.innerHeight - e.clientY;
    } else if (direction === 'bottom') {
      newSize = e.clientY;
    }
    if (newSize < minSize) newSize = minSize;
    if (newSize > maxSize) newSize = maxSize;
    setSize(newSize);
    if (onResize) onResize(newSize);
  };

  const onMouseUp = () => {
    isResizing.current = false;
  };

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const resizerStyle = {
    position: 'absolute',
    cursor: direction === 'right' || direction === 'left' ? 'ew-resize' : 'ns-resize',
    zIndex: 100,
  };

  const containerStyle = {
    position: 'relative',
    display: 'flex',
  };

  // Apply appropriate styles depending on direction
  if (direction === 'right') {
    containerStyle.width = size;
    resizerStyle.top = 0;
    resizerStyle.right = 0;
    resizerStyle.width = '5px';
    resizerStyle.height = '100%';
  } else if (direction === 'left') {
    containerStyle.width = size;
    resizerStyle.top = 0;
    resizerStyle.left = 0;
    resizerStyle.width = '5px';
    resizerStyle.height = '100%';
  } else if (direction === 'top') {
    containerStyle.height = size;
    resizerStyle.top = 0;
    resizerStyle.left = 0;
    resizerStyle.height = '5px';
    resizerStyle.width = '100%';
  } else if (direction === 'bottom') {
    containerStyle.height = size;
    resizerStyle.bottom = 0;
    resizerStyle.left = 0;
    resizerStyle.height = '5px';
    resizerStyle.width = '100%';
  }

  return (
    <div className={classNames('resizable-container', className)} style={containerStyle}>
      {children}
      <div
        className={ classNames('resizer', {
          'resizer-right': direction === 'right',
          'resizer-left': direction === 'left',
          'resizer-top': direction === 'top',
          'resizer-bottom': direction === 'bottom'
        }) }
        style={resizerStyle}
        onMouseDown={onMouseDown}
        aria-label="Resize handle"
        role="separator"
        tabIndex={0}
      />
    </div>
  );
}

export default ResizableContainer;
