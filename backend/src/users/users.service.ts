import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateRepresentativeDto } from './dto/create-representative.dto';
import { ListRepresentativesQueryDto } from './dto/list-representatives-query.dto';
import { UpdateRepresentativeDto } from './dto/update-representative.dto';
import { AdminUser } from './admin-user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly usersRepository: Repository<AdminUser>,
  ) {}

  async findRepresentatives(query: ListRepresentativesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.username',
        'user.fullName',
        'user.role',
        'user.isActive',
        'user.createdAt',
        'user.updatedAt',
      ])
      .where('user.role = :role', { role: 'REPRESENTATIVE' })
      .orderBy('user.isActive', 'DESC')
      .addOrderBy('user.createdAt', 'DESC');

    if (query.status === 'active') {
      queryBuilder.andWhere('user.isActive = true');
    } else if (query.status === 'inactive') {
      queryBuilder.andWhere('user.isActive = false');
    }

    if (query.search?.trim()) {
      const value = `%${query.search.trim()}%`;
      queryBuilder.andWhere(
        '(user.fullName ILIKE :value OR user.username ILIKE :value)',
        { value },
      );
    }

    const [items, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
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

  async deleteRepresentative(id: string) {
    const representative = await this.usersRepository.findOne({
      where: { id, role: 'REPRESENTATIVE' },
    });

    if (!representative) {
      throw new NotFoundException('Musteri temsilcisi bulunamadi.');
    }

    await this.usersRepository.remove(representative);
    return { success: true };
  }
}
