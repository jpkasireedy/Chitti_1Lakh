export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  approved: boolean;
  chitTakenMonth: number | null;
  password?: string; // Members will have this
  disabled: boolean;
}

export interface Payment {
  userId: string;
  month: number;
  isPaid: boolean;
  amount: number;
}

export interface ChitMonth {
  month: number;
  takenByUserId: string | null;
  payoutAmount: number;
}

export interface UpiDetails {
  id: string;
  qrCodeUrl: string;
}

export interface ChitConfig {
    startDate: string; // YYYY-MM-DD
    totalMonths: number;
    baseContribution: number;
    prizedContribution: number;
    startingPayout: number;
    payoutIncrement: number;
}