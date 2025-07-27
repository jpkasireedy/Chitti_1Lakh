
import { User, UserRole, Payment, ChitMonth, UpiDetails, ChitConfig } from '../types';
import { DEFAULT_CHIT_CONFIG, ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD } from '../constants';
import { validatePassword } from '../utils/validation';

class DataService {
  private users: User[];
  private payments: Payment[];
  private chitMonths: ChitMonth[];
  private upiDetails: UpiDetails;
  private chitConfig: ChitConfig;
  private adminPassword: string;

  constructor() {
    this.chitConfig = JSON.parse(localStorage.getItem('chitti_config') || JSON.stringify(DEFAULT_CHIT_CONFIG));
    this.users = JSON.parse(localStorage.getItem('chitti_users') || 'null') || this.generateInitialUsers();
    this.chitMonths = JSON.parse(localStorage.getItem('chitti_months') || 'null') || this.generateInitialChitMonths();
    this.payments = JSON.parse(localStorage.getItem('chitti_payments') || 'null') || this.generateInitialPayments();
    this.upiDetails = JSON.parse(localStorage.getItem('chitti_upi') || JSON.stringify({
        id: "chitti-fund@upi",
        qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=chitti-fund@upi"
    }));
    this.adminPassword = localStorage.getItem('chitti_admin_password') || DEFAULT_ADMIN_PASSWORD;
    this.persist();
  }
  
  private generateInitialUsers(): User[] {
    const initialUsers: User[] = [
        { id: 'admin-0', name: 'Administrator', username: 'admin', role: UserRole.ADMIN, approved: true, chitTakenMonth: null, disabled: false },
        ...Array.from({ length: 20 }, (_, i) => ({
            id: `user-${i + 1}`,
            name: `Member ${i + 1}`,
            username: `member${i + 1}`,
            password: `member${i + 1}`, // Default password
            role: UserRole.MEMBER,
            approved: i < 18,
            chitTakenMonth: null,
            disabled: false,
        }))
    ];
    // Pre-assign some history for demonstration
    initialUsers[1].chitTakenMonth = 1; 
    initialUsers[3].chitTakenMonth = 2;
    return initialUsers;
  }

  private generateInitialChitMonths(): ChitMonth[] {
    const months = Array.from({ length: this.chitConfig.totalMonths }, (_, i) => ({
        month: i + 1,
        takenByUserId: null,
        payoutAmount: this.chitConfig.startingPayout + (i * this.chitConfig.payoutIncrement),
    }));
     if (this.users.find(u => u.id === 'user-1')) months[0].takenByUserId = 'user-1';
     if (this.users.find(u => u.id === 'user-3')) months[1].takenByUserId = 'user-3';
    return months;
  }

  private generateInitialPayments(): Payment[] {
    const payments: Payment[] = [];
    this.users.forEach(user => {
        if (user.role === UserRole.MEMBER) {
            for (let month = 1; month <= this.chitConfig.totalMonths; month++) {
                const hasTakenChit = user.chitTakenMonth !== null && month > user.chitTakenMonth;
                const amount = hasTakenChit ? this.chitConfig.prizedContribution : this.chitConfig.baseContribution;
                
                let isPaid = false;
                if (user.chitTakenMonth && month < user.chitTakenMonth) isPaid = true;
                if (month < 3) isPaid = Math.random() > 0.1;

                payments.push({ userId: user.id, month, isPaid, amount });
            }
        }
    });
    return payments;
  }

  private persist() {
    localStorage.setItem('chitti_config', JSON.stringify(this.chitConfig));
    localStorage.setItem('chitti_users', JSON.stringify(this.users));
    localStorage.setItem('chitti_payments', JSON.stringify(this.payments));
    localStorage.setItem('chitti_months', JSON.stringify(this.chitMonths));
    localStorage.setItem('chitti_upi', JSON.stringify(this.upiDetails));
    localStorage.setItem('chitti_admin_password', this.adminPassword);
  }
  
  public resetData() {
    localStorage.clear();
    
    this.chitConfig = DEFAULT_CHIT_CONFIG;
    this.users = this.generateInitialUsers();
    this.chitMonths = this.generateInitialChitMonths();
    this.payments = this.generateInitialPayments();
    this.upiDetails = {
        id: "chitti-fund@upi",
        qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=chitti-fund@upi"
    };
    this.adminPassword = DEFAULT_ADMIN_PASSWORD;
    
    this.persist();
  }

  public authenticateUser(username: string, password: string): User | null {
    const lowerCaseUsername = username.toLowerCase();
    const user = this.users.find(u => u.username.toLowerCase() === lowerCaseUsername);

    if (!user) return null;

    if (user.role === UserRole.ADMIN) {
      if (password === this.adminPassword) return user;
    } else if (user.role === UserRole.MEMBER) {
      if (password === user.password) return user;
    }

    return null;
  }
  
  public changeAdminPassword(currentPassword: string, newPassword: string): { success: boolean, message: string } {
    if (this.adminPassword !== currentPassword) {
        return { success: false, message: 'Current password is incorrect.' };
    }
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
        return { success: false, message: validation.message };
    }
    this.adminPassword = newPassword;
    this.persist();
    return { success: true, message: 'Password updated successfully.' };
  }

  public changeMemberPassword(userId: string, currentPassword: string, newPassword: string): { success: boolean, message: string } {
    const user = this.users.find(u => u.id === userId);
    if (!user || user.role !== UserRole.MEMBER) {
        return { success: false, message: 'User not found.' };
    }
    if (user.password !== currentPassword) {
        return { success: false, message: 'Current password is incorrect.' };
    }
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
        return { success: false, message: validation.message };
    }
    user.password = newPassword;
    this.persist();
    return { success: true, message: 'Password updated successfully.' };
  }

  public adminSetMemberPassword(userId: string, newPassword: string): { success: boolean, message: string } {
    const user = this.users.find(u => u.id === userId);
    if (!user || user.role !== UserRole.MEMBER) {
        return { success: false, message: 'User not found.' };
    }
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
        return { success: false, message: validation.message };
    }
    user.password = newPassword;
    this.persist();
    return { success: true, message: `Password successfully set for ${user.name}.` };
  }

  public getUsers(): User[] {
    return this.users.filter(u => u.role === UserRole.MEMBER);
  }

  public getUnapprovedUsers(): User[] {
    return this.users.filter(u => u.role === UserRole.MEMBER && !u.approved);
  }
  
  public getUserById(userId: string): User | undefined {
      return this.users.find(u => u.id === userId);
  }
  
  public getUserByUsername(username: string): User | undefined {
      return this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public getAdminDashboardData() {
    return {
      users: this.users.filter(u => u.role === UserRole.MEMBER),
      payments: this.payments,
      chitMonths: this.chitMonths,
      upiDetails: this.upiDetails,
      chitConfig: this.chitConfig,
    };
  }

  public getMemberDashboardData(userId: string) {
      const user = this.users.find(u => u.id === userId);
      if (!user) return null;
      return {
          user,
          payments: this.payments.filter(p => p.userId === userId),
          chitMonths: this.chitMonths,
          upiDetails: this.upiDetails,
          chitConfig: this.chitConfig,
      }
  }

  public approveUser(userId: string) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.approved = true;
      this.persist();
    }
  }
  
  public updateMember(userId: string, details: {name: string, username: string}): {success: boolean, message: string} {
    const user = this.users.find(u => u.id === userId);
    const existingUsername = this.users.find(u => u.username.toLowerCase() === details.username.toLowerCase() && u.id !== userId);

    if (existingUsername) {
        return {success: false, message: 'Username is already taken.'}
    }
    if(user) {
        user.name = details.name;
        user.username = details.username;
        this.persist();
        return {success: true, message: 'User details updated successfully.'};
    }
    return {success: false, message: 'User not found.'};
  }

  public createNewMember(name: string, username: string): {success: boolean, message: string} {
      if (!name || !username) {
        return { success: false, message: 'Name and username cannot be empty.' };
      }
      const existing = this.getUserByUsername(username);
      if(existing) {
          return { success: false, message: 'Username already exists.' };
      }
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        username,
        password: username, // Default password is username
        role: UserRole.MEMBER,
        approved: false, // Admin must approve
        chitTakenMonth: null,
        disabled: false,
      };
      this.users.push(newUser);
      
      // Also create their payment records
      for (let month = 1; month <= this.chitConfig.totalMonths; month++) {
        this.payments.push({
            userId: newUser.id,
            month,
            isPaid: false,
            amount: this.chitConfig.baseContribution
        });
      }
      this.persist();
      return { success: true, message: 'New member created. Please approve them to grant access.' };
  }
  
  public toggleMemberStatus(userId: string) {
      const user = this.users.find(u => u.id === userId);
      if(user) {
          user.disabled = !user.disabled;
          this.persist();
      }
  }
  
  public deleteMember(userId: string) {
      this.users = this.users.filter(u => u.id !== userId);
      this.payments = this.payments.filter(p => p.userId !== userId);
      // If deleted user won a chit, un-assign it
      this.chitMonths.forEach(m => {
          if (m.takenByUserId === userId) {
              m.takenByUserId = null;
          }
      });
      this.persist();
  }

  public togglePayment(userId: string, month: number) {
    const payment = this.payments.find(p => p.userId === userId && p.month === month);
    if (payment) {
      payment.isPaid = !payment.isPaid;
      this.persist();
    }
  }

  public assignChit(userId: string, month: number) {
    const user = this.users.find(u => u.id === userId);
    const chitMonth = this.chitMonths.find(m => m.month === month);

    if (user && chitMonth && !user.chitTakenMonth && !chitMonth.takenByUserId) {
      user.chitTakenMonth = month;
      chitMonth.takenByUserId = userId;

      // Mark this month's payment as paid
      const paymentThisMonth = this.payments.find(p => p.userId === userId && p.month === month);
      if(paymentThisMonth) paymentThisMonth.isPaid = true;

      // Update future payment amounts
      this.payments.forEach(p => {
        if (p.userId === userId && p.month > month) {
          p.amount = this.chitConfig.prizedContribution;
        }
      });
      this.persist();
    }
  }
  
  public updateUpiDetails(details: UpiDetails) {
      this.upiDetails = details;
      this.persist();
  }
  
  public updateChitConfig(newConfig: ChitConfig) {
      // Recalculate everything
      this.chitConfig = newConfig;
      this.chitMonths = this.generateInitialChitMonths();
      this.payments = this.generateInitialPayments();
      // Important: this reset wipes existing chit winner history.
      this.users.forEach(u => u.chitTakenMonth = null);
      this.persist();
  }
}

export const dataService = new DataService();