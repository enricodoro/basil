import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { OrdersModule } from './orders.module';
import { EntityManager } from 'typeorm';
import { Order } from './entities/order.entity';
import { User } from '../users/entities/user.entity';
import { hash } from 'bcrypt';
import { UsersService } from '../users/users.service';
import { Product } from '../products/entities/product.entity';
import { DateTime } from 'luxon';
import { OrderEntry } from './entities/order-entry.entity';
import { CreateOrderDto } from './dtos/create-order.dto';
import { BadRequestException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          autoLoadEntities: true,
          dropSchema: true,
          synchronize: true,
        }),
        UsersModule,
        ProductsModule,
        CategoriesModule,
        TransactionsModule,
        OrdersModule,
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('checkOrder', () => {
    it('should validate if the date of the order is between (Wed 08:00 - Fri 18:00)', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = module.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        price: 10,
        available: 10,
      });
      expect(
        service.checkOrder({
          user: { id: user.id } as User,
          entries: [{ product, quantity: 5 }] as OrderEntry[],
          deliverAt: DateTime.fromObject({
            weekday: 6,
            hour: 11,
            minute: 0,
            second: 0,
          }).toJSDate(),
        } as CreateOrderDto),
      ).rejects.toThrowError(BadRequestException);
    });

    it('should validate if the quantity of the order is higher than its product', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = module.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        price: 10,
        available: 10,
      });
      expect(
        service.checkOrder({
          user: { id: user.id } as User,
          entries: [{ product, quantity: 20 }] as OrderEntry[],
        } as CreateOrderDto),
      ).rejects.toThrowError(BadRequestException);
    });
  });

  afterEach(() => {
    return module.close();
  });
});
