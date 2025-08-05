import { findConflicts } from '../util/conflicts';

import './styles.css';

async function init() {
  const conflicts = await findConflicts(window.baseXml, window.localXml, window.remoteXml);

  console.log('Conflicts:', conflicts);

  const localTextArea = document.getElementById('localText');
  const remoteTextArea = document.getElementById('remoteText');
  const mergedTextArea = document.getElementById('mergedText');

  localTextArea.value = window.localXml;
  remoteTextArea.value = window.remoteXml;
  mergedTextArea.value = window.localXml; // Default to local XML
}

document.addEventListener('DOMContentLoaded', init);