import { css, html, LitElement } from 'lit';

export class HandwritingTextareaButton extends LitElement {
  // TODO: Drop Shadow
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

        background-color: #311b92;
        color: white;

        user-select: none;

        transition: 280ms ease-in background-color;
      }

      :host(:hover) {
        background-color: #4527a0;
      }
    `;
  }

  protected render(): unknown {
    return html` <slot></slot>`;
  }
}
