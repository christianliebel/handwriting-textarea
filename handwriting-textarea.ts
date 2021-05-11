import { HandwritingTextarea } from './src/HandwritingTextarea.js';
import { HandwritingTextareaCanvas } from './src/HandwritingTextareaCanvas.js';

window.customElements.define('handwriting-textarea', HandwritingTextarea);
window.customElements.define(
  'handwriting-textarea-canvas',
  HandwritingTextareaCanvas
);
