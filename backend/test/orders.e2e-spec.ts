import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../src/features/users/users.module';
import { OrdersModule } from '../src/features/orders/orders.module';
import { ProductsModule } from '../src/features/products/products.module';
import { CategoriesModule } from '../src/features/categories/categories.module';
import { TransactionsModule } from '../src/features/transactions/transactions.module';
import { validation } from '../src/constants';
import { EntityManager } from 'typeorm';
import { User } from '../src/features/users/entities/user.entity';
import { hash } from 'bcrypt';
import { Role } from '../src/features/users/roles.enum';
import {
  Order,
  OrderStatus,
} from '../src/features/orders/entities/order.entity';
import { Product } from '../src/features/products/entities/product.entity';

describe('OrdersController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
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
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe(validation));
    await app.init();
  });

  describe('GET /orders', () => {
    it('should fail if the user is not authenticated', () => {
      return request(app.getHttpServer()).get('/orders').expect(401);
    });

    it('should return the orders', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = app.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.EMPLOYEE,
      });
      await entityManager.save(Order, {
        user: { id: user.id },
      });
      const server = app.getHttpServer();
      const response = await request(server)
        .post('/users/login')
        .send({ username: email, password });
      const authToken = response.body.token;
      return request(server)
        .get('/orders')
        .auth(authToken, { type: 'bearer' })
        .expect(200);
    });

    it('should fail if the role is CUSTOMER', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = app.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.CUSTOMER,
      });
      await entityManager.save(Order, {
        user: { id: user.id },
      });
      const server = app.getHttpServer();
      const response = await request(server)
        .post('/users/login')
        .send({ username: email, password });
      const authToken = response.body.token;
      return request(server)
        .get('/orders')
        .auth(authToken, { type: 'bearer' })
        .expect(403);
    });
  });

  describe('POST /orders', () => {
    it('should fail if the user is not authenticated', () => {
      return request(app.getHttpServer()).post('/orders').expect(401);
    });

    it('should create an order if you are an employee', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = app.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.EMPLOYEE,
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        price: 10,
        available: 10,
      });
      const server = app.getHttpServer();
      const response = await request(server)
        .post('/users/login')
        .send({ username: email, password });
      const authToken = response.body.token;
      return request(server)
        .post('/orders')
        .auth(authToken, { type: 'bearer' })
        .send({
          user: { id: user.id },
          entries: [
            {
              quantity: 1,
              product: { id: product.id },
            },
          ],
        })
        .expect(201);
    });

    it('should create an order if you are a manager', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = app.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.MANAGER,
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        price: 10,
        available: 10,
      });
      const server = app.getHttpServer();
      const response = await request(server)
        .post('/users/login')
        .send({ username: email, password });
      const authToken = response.body.token;
      return request(server)
        .post('/orders')
        .auth(authToken, { type: 'bearer' })
        .send({
          user: { id: user.id },
          entries: [
            {
              quantity: 1,
              product: { id: product.id },
            },
          ],
        })
        .expect(201);
    });

    it('should fail if the role is CUSTOMER', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = app.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.CUSTOMER,
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        price: 10,
        available: 10,
      });
      const server = app.getHttpServer();
      const response = await request(server)
        .post('/users/login')
        .send({ username: email, password });
      const authToken = response.body.token;
      return request(server)
        .post('/orders')
        .auth(authToken, { type: 'bearer' })
        .send({
          user: { id: user.id },
          entries: [
            {
              quantity: 1,
              product: { id: product.id },
            },
          ],
        })
        .expect(403);
    });

    it('should fail if the quantity is 0', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = app.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.EMPLOYEE,
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        price: 10,
        available: 10,
      });
      const server = app.getHttpServer();
      const response = await request(server)
        .post('/users/login')
        .send({ username: email, password });
      const authToken = response.body.token;
      return request(server)
        .post('/orders')
        .auth(authToken, { type: 'bearer' })
        .send({
          user: { id: user.id },
          entries: [
            {
              quantity: 0,
              product: { id: product.id },
            },
          ],
        })
        .expect(400);
    });

    it('should fail if the are not entries', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = app.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.EMPLOYEE,
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        price: 10,
        available: 10,
      });
      const server = app.getHttpServer();
      const response = await request(server)
        .post('/users/login')
        .send({ username: email, password });
      const authToken = response.body.token;
      return request(server)
        .post('/orders')
        .auth(authToken, { type: 'bearer' })
        .send({
          user: { id: user.id },
        })
        .expect(400);
    });

    it('should fail if the are not entries', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = app.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.EMPLOYEE,
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        price: 10,
        available: 2,
      });
      const server = app.getHttpServer();
      const response = await request(server)
        .post('/users/login')
        .send({ username: email, password });
      const authToken = response.body.token;
      return request(server)
        .post('/orders')
        .auth(authToken, { type: 'bearer' })
        .send({
          user: { id: user.id },
          entries: [
            {
              quantity: 10,
              product: { id: product.id },
            },
          ],
        })
        .expect(400);
    });
  });

  describe('PATCH /orders/orderId', () => {
    it('should fail if the user is not authenticated', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = app.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.CUSTOMER,
      });
      const order = await entityManager.save(Order, { user: { id: user.id } });
      return request(app.getHttpServer())
        .patch('/orders/' + order.id)
        .expect(401);
    });

    it('should update a given order', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = app.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.EMPLOYEE,
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        price: 10,
        available: 20,
      });
      const order = await entityManager.save(Order, {
        user: { id: user.id },
        entries: [
          {
            quantity: 10,
            product: { id: product.id },
          },
        ],
      });
      const server = app.getHttpServer();
      const response = await request(server)
        .post('/users/login')
        .send({ username: email, password });
      const authToken = response.body.token;
      return request(server)
        .patch('/orders/' + order.id)
        .auth(authToken, { type: 'bearer' })
        .send({
          status: OrderStatus.COMPLETED,
        })
        .expect(200);
    });

    it('should fail if the role is CUSTOMER', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = app.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.CUSTOMER,
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        price: 10,
        available: 2,
      });
      const order = await entityManager.save(Order, {
        user: { id: user.id },
        entries: [
          {
            quantity: 10,
            product: { id: product.id },
          },
        ],
      });
      const server = app.getHttpServer();
      const response = await request(server)
        .post('/users/login')
        .send({ username: email, password });
      const authToken = response.body.token;
      return request(server)
        .patch('/orders/' + order.id)
        .auth(authToken, { type: 'bearer' })
        .send({
          status: OrderStatus.COMPLETED,
        })
        .expect(403);
    });

    it('should fail if the role is CUSTOMER', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = app.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.RIDER,
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        price: 10,
        available: 2,
      });
      const order = await entityManager.save(Order, {
        user: { id: user.id },
        entries: [
          {
            quantity: 10,
            product: { id: product.id },
          },
        ],
      });
      const server = app.getHttpServer();
      const response = await request(server)
        .post('/users/login')
        .send({ username: email, password });
      const authToken = response.body.token;
      return request(server)
        .patch('/orders/' + order.id)
        .auth(authToken, { type: 'bearer' })
        .send({
          status: OrderStatus.COMPLETED,
        })
        .expect(403);
    });

    it('should fail if the status of the updated order is a previous one', async () => {
      const email = 'test@example.com';
      const password = 'testpwd';
      const entityManager = app.get(EntityManager);
      const user = await entityManager.save(User, {
        email,
        password: await hash(password, 10),
        name: 'John',
        surname: 'Doe',
        role: Role.EMPLOYEE,
      });
      const product = await entityManager.save(Product, {
        name: 'onions',
        description: 'very good onions',
        price: 10,
        available: 10,
      });
      const order = await entityManager.save(Order, {
        user: { id: user.id },
        entries: [
          {
            quantity: 5,
            product: { id: product.id },
          },
        ],
        status: OrderStatus.PAID,
      });
      const server = app.getHttpServer();
      const response = await request(server)
        .post('/users/login')
        .send({ username: email, password });
      const authToken = response.body.token;
      return request(server)
        .patch('/orders/' + order.id)
        .auth(authToken, { type: 'bearer' })
        .send({
          status: OrderStatus.DRAFT,
        })
        .expect(400);
    });
  });

  afterEach(() => {
    return app.close();
  });
});
