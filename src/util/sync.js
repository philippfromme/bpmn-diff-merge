export function syncViewboxes(...viewers) {
  if (viewers.length < 2) {
    console.warn('syncViewboxes requires at least 2 viewers to synchronize');
    return;
  }

  let viewBoxChanging = false;

  viewers.forEach((viewer, index) => {
    viewer.on('canvas.viewbox.changing', () => {
      if (viewBoxChanging) {
        return;
      }

      viewBoxChanging = true;

      const currentViewbox = viewer.get('canvas').viewbox();
      
      viewers.forEach((otherViewer, otherIndex) => {
        if (index !== otherIndex) {
          otherViewer.get('canvas').viewbox(currentViewbox);
        }
      });
    });

    viewer.on('canvas.viewbox.changed', () => {
      viewBoxChanging = false;
    });
  });
}