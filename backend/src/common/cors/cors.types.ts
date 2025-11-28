export type CorsConfig = {
  origin: string[];
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  maxAge: number;
};
