export type AccountEditField = 'email' | 'phone' | 'birthDate' | 'password' | null;

export type UseAccountSettingsParams = {
  birthDate: string;
  email: string;
  phone: string;
};
