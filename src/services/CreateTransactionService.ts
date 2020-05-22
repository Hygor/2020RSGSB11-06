import { getCustomRepository, getRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const validType = type === 'income' || type === 'outcome';
    if (!validType) {
      throw new AppError(`Invalid type of transaction!`);
    }

    const { total } = await transactionsRepository.getBalance();
    if (type === 'outcome' && total < value) {
      throw new AppError('You do not have enough balance!');
    }

    let transactionCategory = await categoryRepository.findOne({
      where: {
        title: category,
        type,
      },
    });

    if (!transactionCategory) {
      transactionCategory = categoryRepository.create({
        title: category,
        type,
      });
      await categoryRepository.save(transactionCategory);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: transactionCategory,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
