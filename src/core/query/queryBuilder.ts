import { FilterQuery, SortOrder, ProjectionType } from 'mongoose';

export interface QueryBuilderOptions<T> {
  filters?: FilterQuery<T>;
  sort?: Record<string, SortOrder>;
  select?: ProjectionType<T>;
  skip?: number;
  limit?: number;
  populate?: string[];
}

export interface QueryCriteria {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'ilike' | 'between' | 'exists' | 'regex';
  value: any;
}

export class QueryBuilder<T> {
  private conditions: FilterQuery<T> = {};
  private sortOptions: Record<string, SortOrder> = {};
  private selectFields: ProjectionType<T> = {};
  private skipCount = 0;
  private limitCount = 0;
  private populateFields: string[] = [];
  private logicalOperator: '$and' | '$or' = '$and';

  where(field: keyof T, value: any): this {
    (this.conditions as any)[field] = value;
    return this;
  }

  whereIn(field: keyof T, values: any[]): this {
    (this.conditions as any)[field] = { $in: values };
    return this;
  }

  whereNotIn(field: keyof T, values: any[]): this {
    (this.conditions as any)[field] = { $nin: values };
    return this;
  }

  whereGt(field: keyof T, value: number | Date): this {
    (this.conditions as any)[field] = { ...(this.conditions as any)[field], $gt: value };
    return this;
  }

  whereGte(field: keyof T, value: number | Date): this {
    (this.conditions as any)[field] = { ...(this.conditions as any)[field], $gte: value };
    return this;
  }

  whereLt(field: keyof T, value: number | Date): this {
    (this.conditions as any)[field] = { ...(this.conditions as any)[field], $lt: value };
    return this;
  }

  whereLte(field: keyof T, value: number | Date): this {
    (this.conditions as any)[field] = { ...(this.conditions as any)[field], $lte: value };
    return this;
  }

  whereLike(field: keyof T, pattern: string): this {
    (this.conditions as any)[field] = { $regex: pattern, $options: '' };
    return this;
  }

  whereILike(field: keyof T, pattern: string): this {
    (this.conditions as any)[field] = { $regex: pattern, $options: 'i' };
    return this;
  }

  whereBetween(field: keyof T, min: any, max: any): this {
    (this.conditions as any)[field] = { $gte: min, $lte: max };
    return this;
  }

  whereExists(field: keyof T, exists: boolean = true): this {
    (this.conditions as any)[field] = { $exists: exists };
    return this;
  }

  whereCriteria(criteria: QueryCriteria[]): this {
    for (const c of criteria) {
      const ops: Record<string, string> = {
        eq: '$eq', neq: '$ne', gt: '$gt', gte: '$gte',
        lt: '$lt', lte: '$lte', in: '$in', nin: '$nin',
        like: '$regex', ilike: '$regex', exists: '$exists',
      };
      if (c.operator === 'like') {
        (this.conditions as any)[c.field] = { $regex: c.value };
      } else if (c.operator === 'ilike') {
        (this.conditions as any)[c.field] = { $regex: c.value, $options: 'i' };
      } else if (c.operator === 'between') {
        const [min, max] = c.value;
        (this.conditions as any)[c.field] = { $gte: min, $lte: max };
      } else {
        const op = ops[c.operator];
        (this.conditions as any)[c.field] = { [op]: c.value };
      }
    }
    return this;
  }

  orWhere(subQuery: (qb: QueryBuilder<T>) => void): this {
    const subQb = new QueryBuilder<T>();
    subQuery(subQb);
    const subConditions = subQb.build();
    if (Object.keys(subConditions).length > 0) {
      this.conditions = {
        ...this.conditions,
        $or: [...(this.conditions.$or || []), subConditions],
      } as any;
    }
    return this;
  }

  sort(field: keyof T, order: 'asc' | 'desc' = 'asc'): this {
    this.sortOptions[field as string] = order === 'asc' ? 1 : -1;
    return this;
  }

  select(...fields: (keyof T)[]): this {
    const selectObj: Record<string, 1> = {};
    for (const f of fields) selectObj[f as string] = 1;
    this.selectFields = selectObj as any;
    return this;
  }

  exclude(...fields: (keyof T)[]): this {
    const excludeObj: Record<string, 0> = {};
    for (const f of fields) excludeObj[f as string] = 0;
    this.selectFields = excludeObj as any;
    return this;
  }

  skip(n: number): this {
    this.skipCount = n;
    return this;
  }

  take(n: number): this {
    this.limitCount = n;
    return this;
  }

  page(pageNum: number, pageSize: number = 20): this {
    this.skipCount = (pageNum - 1) * pageSize;
    this.limitCount = pageSize;
    return this;
  }

  populate(...fields: string[]): this {
    this.populateFields = fields;
    return this;
  }

  build(): FilterQuery<T> {
    return { ...this.conditions };
  }

  toOptions(): QueryBuilderOptions<T> {
    return {
      filters: this.conditions,
      sort: this.sortOptions,
      select: this.selectFields,
      skip: this.skipCount,
      limit: this.limitCount,
      populate: this.populateFields,
    };
  }

  reset(): this {
    this.conditions = {};
    this.sortOptions = {};
    this.selectFields = {};
    this.skipCount = 0;
    this.limitCount = 0;
    this.populateFields = [];
    this.logicalOperator = '$and';
    return this;
  }
}

// Updated on 2026-03-02 14:41:36
