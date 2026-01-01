import { BaseRepository } from './baseRepository';
import { QueryModel, IQuery } from '../models/QueryModel';

export class QueryRepository extends BaseRepository<IQuery> {
  constructor() {
    super(QueryModel);
  }

  async findByQueryText(text: string): Promise<IQuery[]> {
    return this.findAll({ query: { $regex: text, $options: 'i' } } as any);
  }

  async findByStatus(status: string, page: number = 1, limit: number = 20) {
    return this.paginate({ 'insights.status': status } as any, { page, limit });
  }

  async findRecent(limit: number = 10): Promise<IQuery[]> {
    return this.model.find().sort({ createdAt: -1 }).limit(limit).exec();
  }

  async getQueryStats(): Promise<{ total: number; completed: number; failed: number }> {
    const [total, completed, failed] = await Promise.all([
      this.count(),
      this.count({ 'insights.status': 'COMPLETED' } as any),
      this.count({ 'insights.status': 'FAILED' } as any),
    ]);
    return { total, completed, failed };
  }
}
