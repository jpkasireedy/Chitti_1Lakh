import { ChitConfig } from './types';

export const ADMIN_USERNAME = "admin";
export const DEFAULT_ADMIN_PASSWORD = "admin";

export const DEFAULT_CHIT_CONFIG: ChitConfig = {
  startDate: '2024-07-05',
  totalMonths: 20,
  baseContribution: 5000,
  prizedContribution: 6000,
  startingPayout: 95000,
  payoutIncrement: 1000,
};