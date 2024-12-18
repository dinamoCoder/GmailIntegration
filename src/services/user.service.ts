import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../database/schemas/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async storeUser(user: any) {
    return this.userModel.findOneAndUpdate(
      { email: user.email },
      { accessToken: user.accessToken, refreshToken: user.refreshToken },
      { upsert: true, new: true }
    );
  }

  async findUserByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email });
  }
}
