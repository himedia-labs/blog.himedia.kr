export type HashFunction = (
  data: string | Buffer,
  saltOrRounds: string | number,
) => Promise<string>;

export type CompareFunction = (
  data: string | Buffer,
  encrypted: string,
) => Promise<boolean>;
