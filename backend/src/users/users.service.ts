import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateRepresentativeDto } from './dto/create-representative.dto';
import { UpdateRepresentativeDto } from './dto/update-representative.dto';
import { AdminUser } from './admin-user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly usersRepository: Repository<AdminUser>,
  ) {}

  findRepresentatives() {
    return this.usersRepository.find({
      where: { role: 'REPRESENTATIVE' },
      order: {
        isActive: 'DESC',
        createdAt: 'DESC',
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createRepresentative(dto: CreateRepresentativeDto) {
    const username = dto.username.trim().toLowerCase();
    const existing = await this.usersRepository.findOne({
      where: { username },
    });

    if (existing) {
      throw new ConflictException('Bu kullanici adi zaten kullaniliyor.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const representative = this.usersRepository.create({
      username,
      fullName: dto.fullName.trim(),
      passwordHash,
      role: 'REPRESENTATIVE',
      isActive: dto.isActive ?? true,
    });

    const saved = await this.usersRepository.save(representative);
    return {
      id: saved.id,
      username: saved.username,
      fullName: saved.fullName,
      role: saved.role,
      isActive: saved.isActive,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async updateRepresentative(id: string, dto: UpdateRepresentativeDto) {
    const representative = await this.usersRepository.findOne({
      where: { id, role: 'REPRESENTATIVE' },
    });

    if (!representative) {
      throw new NotFoundException('Musteri temsilcisi bulunamadi.');
    }

    if (dto.fullName !== undefined) {
      representative.fullName = dto.fullName.trim();
    }

    if (dto.password) {
      representative.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.isActive !== undefined) {
      representative.isActive = dto.isActive;
    }

    const saved = await this.usersRepository.save(representative);
    return {
      id: saved.id,
      username: saved.username,
      fullName: saved.fullName,
      role: saved.role,
      isActive: saved.isActive,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}
