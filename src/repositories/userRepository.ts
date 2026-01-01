import { BaseRepository } from './baseRepository';
import { UserModel, IUser } from '../models/UserModel';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email: email.toLowerCase() } as any);
  }

  async findByUsername(username: string): Promise<IUser | null> {
    return this.findOne({ username } as any);
  }

  async findByIdExcludingPassword(id: string): Promise<IUser | null> {
    return this.model.findById(id).select('-pwdHash').exec();
  }

  async updateRole(id: string, role: 'Admin' | 'User' | 'Manager' | 'Viewer'): Promise<IUser | null> {
    return this.update(id, { role } as any);
  }

  async findActiveUsers(page: number = 1, limit: number = 20) {
    return this.paginate({ isActive: true } as any, { page, limit });
  }
}
