import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { User as UserEntity } from './entities/user.entity';
import { UserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { UserCompleteDto } from './dto/userComplete.dto';
import { USER_REPOSITORY_TOKEN } from 'src/common/config/databaseTokens.constants';
import { Repository } from 'typeorm';
import { UserCreateDto } from './dto/userCreate.dto';
import {
  UserAlreadyExistsException,
  UserNotFoundException,
} from 'src/common/exceptions';
import { UserUpdateDto } from './dto/userUpdate.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  public async create(userDto: UserCreateDto): Promise<UserCompleteDto> {
    const user = await this.getUserByNameAndEmail(userDto);
    if (user) {
      throw new UserAlreadyExistsException();
    }

    const userEntity = Object.assign(new UserEntity(), userDto);
    const { password } = userEntity;

    userEntity.password = this.encryptPassword(password);

    const userEntitySaved = await this.usersRepository.save(userEntity);
    return new UserCompleteDto(userEntitySaved);
  }

  public async update(userDto: UserUpdateDto): Promise<UserCompleteDto> {
    //Check here if user who requested is admin or the same user
    const sameUserOrAdmin = 'asasd';
    const user = await this.getUserById(userDto.uid);

    console.log(user);

    if (!sameUserOrAdmin || !user) {
      throw new UnauthorizedException();
    }

    const { password } = userDto;

    if (password !== user.password) {
      userDto.password = this.encryptPassword(password);
    }

    await this.usersRepository.update(user, userDto);

    return new UserCompleteDto(userDto);
  }

  public async delete(id: string) {
    const user = await this.getUserById(id);

    if (!user) {
      throw new UserNotFoundException(id);
    }

    return this.usersRepository.delete(user);
  }

  public async getAllUsers(): Promise<UserCompleteDto[]> {
    const usersEntities = await this.usersRepository.find();

    return usersEntities.map(user => new UserCompleteDto(user));
  }

  public async getUserById(id: string): Promise<UserEntity> {
    const userEntity = await this.usersRepository.findOne({
      where: { uid: id },
    });

    return userEntity;

    /* return new UserCompleteDto(userEntity); */
  }

  public async getUserByName(name: string): Promise<UserEntity> {
    const userEntity = await this.usersRepository.findOne({
      where: { username: name },
    });

    return userEntity;
  }

  public getUserByNameAndEmail(user: UserDto): Promise<UserEntity> {
    return this.usersRepository.findOne({
      where: [{ username: user.username }, { email: user.email }],
    });
  }

  private encryptPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }
}
