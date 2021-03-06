import { DateTime } from 'luxon';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '../../core/services/typeorm-crud.service';
import { UpdateOrderEntryDto } from '../orders/dtos/update-order-entry.dto';
import { OrdersService } from '../orders/orders.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/roles.enum';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { Product, ProductId } from './entities/product.entity';

@Injectable()
export class ProductsService extends TypeOrmCrudService<Product> {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {
    super(productsRepository);
  }

  /**
   * Reserves `quantity` of `products`
   */
  reserveProductAmount(product: Product, quantity: number) {
    return this.productsRepository.update(
      {
        id: product.id,
      },
      {
        available: product.available - quantity,
        reserved: product.reserved + quantity,
      },
    );
  }

  /**
   * Resets the product availability
   */
  resetProductsAvailability() {
    return this.productsRepository.update(
      {},
      {
        available: 0,
        reserved: 0,
      },
    );
  }

  async validateCreateProductDto(dto: CreateProductDto, user: User) {
    if (user.role === Role.FARMER) {
      dto.farmer = user;
      dto.public = false;
      delete dto.reserved;
    }
    if (user.role !== Role.FARMER) {
      if (!dto.farmer) {
        throw new BadRequestException({
          constraints: {
            farmer: `The product must contains farmer`,
          },
        });
      }
    }
    return dto;
  }

  async validateUpdateProductDto(
    id: ProductId,
    dto: UpdateProductDto,
    user: User,
  ) {
    const product = await this.productsRepository.findOne(id, {
      relations: ['farmer'],
    });
    if (!product) {
      throw new NotFoundException('ProductNotFound', `Product ${id} not found`);
    }

    if (user.role === Role.FARMER) {
      if (product.farmer.id !== user.id) {
        throw new BadRequestException(
          'Product error',
          `The product not belongs to this farmer`,
        );
      }
      delete dto.public;
      delete dto.reserved;
    }
    if (dto.reserved) {
      const now = DateTime.now();
      const from =
        now.weekday === 1 && now.hour <= 9
          ? now
              .set({
                weekday: 7,
                hour: 23,
                minute: 0,
                second: 0,
                millisecond: 0,
              })
              .minus({ weeks: 1 })
          : now.set({
              weekday: 7,
              hour: 23,
              minute: 0,
              second: 0,
              millisecond: 0,
            });
      const to = from.plus({ hours: 10 });
      if (now < from || now > to) {
        throw new BadRequestException({
          constraints: {
            reserved: 'Cannot edit reserved count now',
          },
        });
      }
    }

    if (dto.available) {
      const now = DateTime.now();
      const from = now.set({
        weekday: 1,
        hour: 18,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      const to = now.set({
        weekday: 6,
        hour: 9,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      if (now < from || now > to) {
        throw new BadRequestException({
          constraints: {
            available: 'Cannot edit available count now',
          },
        });
      }
    }

    if (dto.reserved < product.reserved) {
      const diff = product.reserved - dto.reserved;
      const entries = await this.ordersService.getOrderEntriesContainingProduct(
        product.id,
      );
      let deletedEntries = 0;
      let entryIndex = 0;
      while (deletedEntries < diff) {
        const toDelete = diff - deletedEntries;
        if (toDelete < entries[entryIndex].quantity) {
          // update quantity
          const newQuantity = entries[entryIndex].quantity - toDelete;
          await this.ordersService.updateOrderEntry(entries[entryIndex].id, {
            quantity: newQuantity,
          } as UpdateOrderEntryDto);
          break;
        } else {
          // delete entry
          deletedEntries += entries[entryIndex].quantity;
          await this.ordersService.deleteOrderEntry(entries[entryIndex].id);
          entryIndex++;
        }
      }
    }

    return dto;
  }

  getAllStockProducts(user) {
    if (user.role === Role.FARMER) {
      return this.productsRepository.find({
        where: {
          farmer: user.id,
        },
        relations: ['farmer', 'category'],
      });
    } else
      return this.productsRepository.find({
        relations: ['farmer', 'category'],
      });
  }

  async getSingleStockProduct(user, id) {
    if (user.role === Role.FARMER) {
      const product = await this.productsRepository.findOne({
        where: {
          farmer: user.id,
          id: id,
        },
        relations: ['farmer', 'category'],
      });
      if (!product) {
        throw new BadRequestException({
          constraints: {
            reserved: 'Cannot retrieve this product',
          },
        });
      } else {
        return product;
      }
    } else
      return this.productsRepository.findOne(id, {
        relations: ['farmer', 'category'],
      });
  }
}
