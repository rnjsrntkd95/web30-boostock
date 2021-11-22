import { getConnection, QueryRunner } from 'typeorm';
import { Request, Response } from 'express';
import { CommonError } from '@errors/index';
import Crypto from 'crypto';

export const snakeToCamel = (str) => {
	return str.toLowerCase().replace(/([-_][a-z])/g, (group) => {
		return group.toUpperCase().replace('-', '').replace('_', '');
	});
};

export const camelToSnake = (str) => {
	return str.replace(/[A-Z]/g, (letter) => {
		return `_${letter.toLowerCase()}`;
	});
};

export const binArrayToJson = (binArray: ArrayBufferLike) => JSON.parse(new TextDecoder().decode(binArray));
export const JsonToBinArray = (json: unknown): Uint8Array => new TextEncoder().encode(JSON.stringify(json, null, 0));

export const toJsonFromError = (error: CommonError): { status: number; json: { error: string; message: string } } => {
	return {
		status: error.status || 500,
		json: {
			error: error.name,
			message: error.message,
		},
	};
};

export const generateUUID = (): string => {
	return Crypto.randomUUID();
};

export const transaction = async (
	callback: (queryRunner: QueryRunner, commit: () => void, rollaback: (err: CommonError) => void, release: () => void) => void,
	req?: Request,
	res?: Response,
	next?,
): Promise<void> => {
	const connection = getConnection();
	const queryRunner = connection.createQueryRunner();

	const commit = () => {
		queryRunner.commitTransaction();
	};
	const rollback = (err) => {
		next(err);
		queryRunner.rollbackTransaction();
	};
	const release = () => {
		queryRunner.release();
	};

	await queryRunner.connect();
	await queryRunner.startTransaction();

	try {
		callback(queryRunner, commit, rollback, release);
	} catch (err: unknown) {
		queryRunner.rollbackTransaction();
		queryRunner.release();
	}
};

export { QueryRunner, EntityManager } from 'typeorm';
