import { IconType } from 'react-icons';

export type NavItem = {
  label: string;
  href?: string;
  Icon?: IconType;
  isAuthDependent?: boolean;
};
