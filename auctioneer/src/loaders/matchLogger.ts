/* eslint-disable no-await-in-loop */
import EventEmitter from '@helper/eventEmitter';
import StockRepository from '@repositories/StockRepository';
import AuctioneerService from '@services/AuctioneerService';
import { getCustomRepository } from 'typeorm';

const auctioneerServiceInstance = new AuctioneerService();

const waitingSet = {};
const auctioneerLoader = async (): Promise<void> => {
	const stockRepository = getCustomRepository(StockRepository);
	const stockCodeList = await stockRepository.readStockCodeList();
	stockCodeList.forEach(({ code }) => {
		waitingSet[code] = false;
	});
};

const runAuctioneer = async (stockCode: string): Promise<void> => {
	waitingSet[stockCode] = true;
	while (await auctioneerServiceInstance.bidAsk(stockCode));
	waitingSet[stockCode] = false;
};

EventEmitter.on('waiting', (stockCode: string): void => {
	if (waitingSet[stockCode]) return;
	runAuctioneer(stockCode);
});

export default auctioneerLoader;
