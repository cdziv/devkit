export abstract class ErrorWithCode extends Error {
  abstract readonly code: string;
  abstract override readonly name: string;

  constructor(message: string) {
    super(message);
  }

  override toString(): string {
    return `${this.name} (${this.code}): ${this.message}`;
  }
}
