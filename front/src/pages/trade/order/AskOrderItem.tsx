import React from 'react';
import { IAskOrderItem } from '@recoil/stockOrders/index';
import formatNumber from '@common/utils/formatNumber';
import ITotalAndMaxAmount from './ITotalAndMaxAmount';

interface IProps {
	askOrder: IAskOrderItem;
	totalAndMaxAmount: ITotalAndMaxAmount;
	currentPrice: number;
	volumeWidth: (amount: number, maxAmount: number) => string;
	setBidAskPrice: (price: number) => void;
	getPriceColorClass: (price: number, currentPrice: number) => string;
}

const AskOrderItem = ({ askOrder, totalAndMaxAmount, currentPrice, volumeWidth, setBidAskPrice, getPriceColorClass }: IProps) => {
	return (
		<tr>
			<td className="order-row-amount sell-amount active">
				<button type="button" className="amount-button" onClick={() => setBidAskPrice(askOrder.price)}>
					<div
						style={{
							width: volumeWidth(askOrder.amount, totalAndMaxAmount.maxAmount),
						}}
						className="amount-bar sell-amount-bar"
					>
						&nbsp;
					</div>
					<p className="amount-text sell">{formatNumber(askOrder.amount)}</p>
				</button>
			</td>
			<td className="order-row-price">
				<button
					type="button"
					className={`order-row-price-data order-sell ${getPriceColorClass(askOrder.price, currentPrice)}`}
					onClick={() => setBidAskPrice(askOrder.price)}
				>
					{formatNumber(askOrder.price)}
				</button>
			</td>
			<td className="order-row-amount buy-amount" />
		</tr>
	);
};

export default AskOrderItem;