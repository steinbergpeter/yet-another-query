import { NextRequest } from 'next/server';

export interface ModelConfig {
  // Basic field filters
  stringFields?: string[];
  dateFields?: string[];
  booleanFields?: string[];
  numberFields?: string[];

  // Relation filters
  relations?: {
    [relationName: string]: {
      // Fields that can be searched in the related model
      searchableFields?: string[];
      // Boolean filters like "hasPublishedPosts"
      booleanFilters?: string[];
    };
  };

  // Default ordering
  defaultOrderBy?: string;
  defaultOrderDir?: 'asc' | 'desc';

  // Default pagination
  defaultLimit?: number;
  maxLimit?: number;
}

export class QueryBuilder<T = any> {
  private query: any = {};
  private config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  static fromRequest<T>(
    request: NextRequest,
    config: ModelConfig
  ): QueryBuilder<T> {
    const builder = new QueryBuilder<T>(config);
    const { searchParams } = new URL(request.url);

    builder
      .parseSelectInclude(searchParams)
      .parseWhereConditions(searchParams)
      .parseOrderBy(searchParams)
      .parsePagination(searchParams)
      .parseDistinct(searchParams);

    return builder;
  }

  private parseSelectInclude(searchParams: URLSearchParams): this {
    const includeParam = searchParams.get('include');
    const selectParam = searchParams.get('select');

    if (selectParam) {
      this.query.select = this.parseSelectFields(selectParam);
    } else if (includeParam) {
      this.query.include = this.parseIncludeFields(includeParam);
    }

    return this;
  }

  private parseWhereConditions(searchParams: URLSearchParams): this {
    const whereConditions: any = {};

    // Handle string fields
    this.config.stringFields?.forEach((field) => {
      const exact = searchParams.get(field);
      const contains = searchParams.get(`${field}Contains`);
      const startsWith = searchParams.get(`${field}StartsWith`);
      const endsWith = searchParams.get(`${field}EndsWith`);

      if (exact) whereConditions[field] = exact;
      if (contains) whereConditions[field] = { contains, mode: 'insensitive' };
      if (startsWith)
        whereConditions[field] = { startsWith, mode: 'insensitive' };
      if (endsWith) whereConditions[field] = { endsWith, mode: 'insensitive' };
    });

    // Handle date fields
    this.config.dateFields?.forEach((field) => {
      const after = searchParams.get(`${field}After`);
      const before = searchParams.get(`${field}Before`);

      if (after || before) {
        whereConditions[field] = {};
        if (after) whereConditions[field].gte = new Date(after);
        if (before) whereConditions[field].lte = new Date(before);
      }
    });

    // Handle boolean fields
    this.config.booleanFields?.forEach((field) => {
      const value = searchParams.get(field);
      if (value === 'true') whereConditions[field] = true;
      if (value === 'false') whereConditions[field] = false;
    });

    // Handle number fields
    this.config.numberFields?.forEach((field) => {
      const exact = searchParams.get(field);
      const min = searchParams.get(`${field}Min`);
      const max = searchParams.get(`${field}Max`);

      if (exact) whereConditions[field] = parseInt(exact);
      if (min || max) {
        whereConditions[field] = {};
        if (min) whereConditions[field].gte = parseInt(min);
        if (max) whereConditions[field].lte = parseInt(max);
      }
    });

    // Handle relation filters
    Object.entries(this.config.relations || {}).forEach(
      ([relationName, relationConfig]) => {
        // Boolean relation filters (e.g., "hasPublishedPosts")
        relationConfig.booleanFilters?.forEach((filter) => {
          const value = searchParams.get(filter);
          if (value === 'true') {
            whereConditions[relationName] = { some: {} };
          } else if (value === 'false') {
            whereConditions[relationName] = { none: {} };
          }
        });

        // Searchable fields in relations
        relationConfig.searchableFields?.forEach((field) => {
          const searchValue = searchParams.get(
            `${relationName}${
              field.charAt(0).toUpperCase() + field.slice(1)
            }Contains`
          );
          if (searchValue) {
            whereConditions[relationName] = {
              some: {
                [field]: { contains: searchValue, mode: 'insensitive' },
              },
            };
          }
        });
      }
    );

    // Handle complex AND/OR conditions
    const andConditions = searchParams.get('and');
    const orConditions = searchParams.get('or');

    if (
      andConditions ||
      orConditions ||
      Object.keys(whereConditions).length > 0
    ) {
      const finalWhere: any = {};

      if (Object.keys(whereConditions).length > 0) {
        Object.assign(finalWhere, whereConditions);
      }

      if (andConditions) {
        finalWhere.AND = JSON.parse(andConditions);
      }

      if (orConditions) {
        finalWhere.OR = JSON.parse(orConditions);
      }

      this.query.where = finalWhere;
    }

    return this;
  }

  private parseOrderBy(searchParams: URLSearchParams): this {
    const orderBy = searchParams.get('orderBy');
    const orderDir =
      searchParams.get('orderDir') || this.config.defaultOrderDir || 'asc';

    if (orderBy) {
      if (orderBy.includes(',')) {
        const fields = orderBy.split(',');
        const directions = orderDir.split(',');
        this.query.orderBy = fields.map((field, index) => ({
          [field.trim()]: directions[index]?.trim() || 'asc',
        }));
      } else {
        if (orderBy.includes('.')) {
          const [relation, field] = orderBy.split('.');
          this.query.orderBy = { [relation]: { [field]: orderDir } };
        } else {
          this.query.orderBy = { [orderBy]: orderDir };
        }
      }
    } else if (this.config.defaultOrderBy) {
      this.query.orderBy = {
        [this.config.defaultOrderBy]: this.config.defaultOrderDir || 'asc',
      };
    }

    return this;
  }

  private parsePagination(searchParams: URLSearchParams): this {
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(
      parseInt(
        searchParams.get('limit') || String(this.config.defaultLimit || 10)
      ),
      this.config.maxLimit || 100
    );
    const skip = searchParams.get('skip');
    const take = searchParams.get('take');
    const cursor = searchParams.get('cursor');

    if (skip || take) {
      if (skip) this.query.skip = parseInt(skip);
      if (take)
        this.query.take = Math.min(parseInt(take), this.config.maxLimit || 100);
    } else {
      this.query.skip = (page - 1) * limit;
      this.query.take = limit;
    }

    if (cursor) {
      this.query.cursor = { id: cursor };
      this.query.skip = 1;
    }

    return this;
  }

  private parseDistinct(searchParams: URLSearchParams): this {
    const distinct = searchParams.get('distinct');
    if (distinct) {
      this.query.distinct = distinct.split(',').map((field) => field.trim());
    }
    return this;
  }

  private parseSelectFields(selectParam: string) {
    const select: any = {};
    const fields = selectParam.split(',');

    fields.forEach((field) => {
      const trimmed = field.trim();

      if (trimmed.includes('.')) {
        const [relation, subField] = trimmed.split('.');
        if (!select[relation]) {
          select[relation] = { select: {} };
        }
        if (subField === '_count') {
          select[relation]._count = true;
        } else {
          select[relation].select[subField] = true;
        }
      } else if (trimmed === '_count') {
        select._count = true;
      } else {
        select[trimmed] = true;
      }
    });

    return select;
  }

  private parseIncludeFields(includeParam: string) {
    const include: any = {};
    const fields = includeParam.split(',');

    fields.forEach((field) => {
      const trimmed = field.trim();

      if (trimmed === '_count') {
        include._count = true;
      } else if (trimmed.includes(':')) {
        const [relation, condition] = trimmed.split(':');
        const [condField, condValue] = condition.split('=');
        include[relation] = {
          where: {
            [condField]:
              condValue === 'true'
                ? true
                : condValue === 'false'
                ? false
                : condValue,
          },
        };
      } else {
        include[trimmed] = true;
      }
    });

    return include;
  }

  build() {
    return this.query;
  }

  // Helper methods for common operations
  addWhere(condition: any): this {
    if (!this.query.where) {
      this.query.where = {};
    }
    Object.assign(this.query.where, condition);
    return this;
  }

  setOrderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.query.orderBy = { [field]: direction };
    return this;
  }

  setLimit(limit: number): this {
    this.query.take = Math.min(limit, this.config.maxLimit || 100);
    return this;
  }
}
