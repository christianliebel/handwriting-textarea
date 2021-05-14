import { css, html, LitElement } from 'lit';

export class HandwritingTextareaButton extends LitElement {
  static get styles() {
    return css`
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;

        border-radius: 50%;
        cursor: pointer;

        width: 56px;
        height: 56px;
        font-size: 24px;

        background-color: #6002ee;
        color: white;

        box-shadow: 0 5px 10px rgba(0 0 0 / 0.2);

        user-select: none;

        transition: 280ms ease-in background-color;
      }

      :host(:hover) {
        background-color: #7e3ff2;
      }
    `;
  }

  protected render(): unknown {
    return html` <slot></slot>`;
  }
}
