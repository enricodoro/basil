import { BadRequestException, Injectable } from '@nestjs/common';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dtos/create-order.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService extends TypeOrmCrudService<Order> {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly productsService: ProductsService,
  ) {
    super(orderRepository);
  }

  async checkOrder(dto: CreateOrderDto) {
    if (!dto.entries?.length) {
      throw new BadRequestException(
        'OrderWithoutEntries',
        'Cannot create an empty order. Please provide at least one entry.',
      );
    }
    if (dto.deliverAt) {
      const deliveryDate = DateTime.fromJSDate(dto.deliverAt);
      const from = DateTime.now()
        .plus({ week: 1 })
        .set({ weekday: 3, hour: 8, minute: 0, second: 0, millisecond: 0 });
      const to = from.set({ weekday: 7, hour: 18 });
      if (deliveryDate < from || deliveryDate > to) {
        throw new BadRequestException(
          'OrderInvalidDeliveryDate',
          'The delivery date is not in the permitted range (Wed 08:00 - Fri 18:00)',
        );
      }
    }
    for (const entry of dto.entries) {
      const product = await this.productsService.findOne(entry.product?.id);
      if (!product) {
        throw new BadRequestException(
          'OrderEntryProductNotFound',
          'An entry in your order references an invalid product',
        );
      }
      if (product.available < entry.quantity) {
        throw new BadRequestException(
          'OrderEntryInsufficientProduct',
          `There is not enough ${product.name} to satisfy your request`,
        );
      }
      await this.productsService.reserveProductAmount(product, entry.quantity);
    }
    return dto;
  }
}
