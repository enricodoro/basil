import { DateTime } from 'luxon';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class SchedulingService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Cron('0 23 * * 0')
  closeWeeklySales(controlled = false) {
    return Promise.all([
      this.productsService.resetProductsAvailability(),
      this.ordersService.lockBaskets(),
    ]).then(() => {
      if (controlled) {
        const now = DateTime.now();
        let daysToSynday = 7 - now.weekday;
        if (daysToSynday === 0) {
          if (now.hour >= 23 && now.millisecond >= 0) {
            daysToSynday = 7;
          }
        }
        const date = now
          .plus({
            days: daysToSynday,
          })
          .set({
            hour: 23,
            minute: 0,
            second: 0,
            millisecond: 0,
          })
          .toString();
        process.env.FAKETIME = date;
        console.log('Setting date to', date);
        console.log('New date', new Date());
      }
    });
  }
}
