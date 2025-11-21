export type CorsConfig = {
  origin: string[];
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders?: string[];
  maxAge: number;
  preflightContinue: boolean;
  optionsSuccessStatus: number;
};
