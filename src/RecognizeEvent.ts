export class RecognizeEvent extends CustomEvent<{ text: string }> {
  constructor(text: string) {
    super('recognize', { detail: { text } });
  }
}
