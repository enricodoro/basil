import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService extends TypeOrmCrudService<Product> {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
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
   * Resets the product availability weekly
   */
  @Cron('0 23 * * 0')
  resetProductAvailability() {
    return this.productsRepository.update(
      {},
      {
        available: 0,
        reserved: 0,
        sold: 0,
      },
    );
  }
}
