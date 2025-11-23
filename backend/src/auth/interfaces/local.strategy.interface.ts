export type VerifyFunction = (
  username: string,
  password: string,
  done: (error: Error | null, user?: any, info?: any) => void,
) => void;

export type LocalStrategyConstructor = new (
  options: {
    usernameField?: string;
    passwordField?: string;
    session?: boolean;
  },
  verify: VerifyFunction,
) => {
  name: string;
  authenticate: (...args: any[]) => void;
};
