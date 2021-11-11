/* eslint-disable class-methods-use-this */
import { getConnection } from 'typeorm';
import { UserRepository, UserStockRepository, OrderRepository, ChartRepository } from '@repositories/index';
import { UserStock, OrderType } from '@models/index';
import BidAskTransaction, { ITransactionLog } from './BidAskTransaction';
import { OrderError, OrderErrorMessage } from './errors';

function donothing() {}

export default class AuctioneerService {
	static instance: AuctioneerService | null = null;

	constructor() {
		if (AuctioneerService.instance) return AuctioneerService.instance;
		AuctioneerService.instance = this;
	}

	public async bidAsk(stockId: number, code: string): Promise<boolean> {
		let result = false;
		const connection = getConnection();
		const queryRunner = connection.createQueryRunner();
		await queryRunner.connect();
		await queryRunner.startTransaction();
		try {
			const OrderRepositoryRunner = queryRunner.manager.getCustomRepository(OrderRepository);
			const UserStockRepositoryRunner = queryRunner.manager.getCustomRepository(UserStockRepository);
			const UserRepositoryRunner = queryRunner.manager.getCustomRepository(UserRepository);
			const ChartRepositoryRunner = queryRunner.manager.getCustomRepository(ChartRepository);

			const orderAsk = await OrderRepositoryRunner.readOrderByDesc(stockId, OrderType.SELL);
			if (orderAsk === undefined || orderAsk.amount <= 0) throw new OrderError(OrderErrorMessage.NO_ORDERS_AVAILABLE);

			const orderBid = await OrderRepositoryRunner.readOrderByDesc(stockId, OrderType.BUY);
			if (orderBid === undefined || orderBid.amount <= 0) throw new OrderError(OrderErrorMessage.NO_ORDERS_AVAILABLE);

			if (orderBid.price < orderAsk.price) throw new OrderError(OrderErrorMessage.NO_ORDERS_AVAILABLE);

			const task = new BidAskTransaction(
				OrderRepositoryRunner,
				UserRepositoryRunner,
				UserStockRepositoryRunner,
				ChartRepositoryRunner,
			);

			const transactionLog: ITransactionLog = {
				code,
				price: orderAsk.price,
				amount: Math.min(orderBid.amount, orderAsk.amount),
				createdAt: new Date().getTime(),
			};

			await task.init(transactionLog);

			const askUser = await UserRepositoryRunner.readUserById(orderAsk.userId);
			if (askUser === undefined) throw new OrderError(OrderErrorMessage.NO_ORDERS_AVAILABLE);
			const askUserStock = askUser.stocks.find((stock: UserStock) => stock.stockId === stockId);

			const bidUser = await UserRepositoryRunner.readUserById(orderBid.userId);
			if (bidUser === undefined) throw new OrderError(OrderErrorMessage.NO_ORDERS_AVAILABLE);
			const bidUserStock = bidUser.stocks.find((stock: UserStock) => stock.stockId === stockId);

			await Promise.all([
				task.bidOrderProcess(bidUser, bidUserStock, orderBid),
				task.askOrderProcess(askUser, askUserStock, orderAsk),
			]);
			await task.noticeProcess();
			queryRunner.commitTransaction();
			result = true;
		} catch (err) {
			if (err instanceof OrderError) donothing();
			queryRunner.rollbackTransaction();
			result = false;
		} finally {
			queryRunner.release();
		}
		return result;
	}
}