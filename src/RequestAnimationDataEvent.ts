import { AnimationData } from './AnimationData.js';

export class RequestAnimationDataEvent extends CustomEvent<never> {
  data: AnimationData = { padding: 0, scrollTop: 0, width: 0, fontSize: '0px' };

  constructor() {
    super('requestanimationdata');
  }

  setAnimationData(data: AnimationData) {
    this.data = data;
  }
}
