const Viewer = window.BpmnJS;

const localViewer = new Viewer({ container: '#local' });
const remoteViewer = new Viewer({ container: '#remote' });

async function loadLocalXml() {
  try {
    await localViewer.importXML(window.localXml);
    console.log('Local XML loaded successfully');
  } catch (error) {
    console.error('Error loading local XML:', error);
  }
}

async function loadRemoteXml() {
  try {
    await remoteViewer.importXML(window.remoteXml);
    console.log('Remote XML loaded successfully');
  } catch (error) {
    console.error('Error loading remote XML:', error);
  }
}

async function init() {
  await loadLocalXml();
  await loadRemoteXml();
}

document.addEventListener('DOMContentLoaded', init);