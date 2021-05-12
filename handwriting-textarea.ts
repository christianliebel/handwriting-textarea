import { HandwritingTextarea } from './src/HandwritingTextarea.js';
import { HandwritingTextareaButton } from './src/HandwritingTextareaButton.js';
import { HandwritingTextareaCanvas } from './src/HandwritingTextareaCanvas.js';

window.customElements.define('handwriting-textarea', HandwritingTextarea);
window.customElements.define(
  'handwriting-textarea-canvas',
  HandwritingTextareaCanvas
);
window.customElements.define(
  'handwriting-textarea-button',
  HandwritingTextareaButton
);
