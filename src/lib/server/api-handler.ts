import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from './prisma';
import { QueryBuilder, ModelConfig } from './query-builder';
import { validateQuery, formatValidationErrors } from '../validation/base';

export interface ApiHandlerOptions<
  TQuerySchema extends z.ZodSchema = z.ZodSchema
> {
  modelName: keyof typeof prisma;
  config: ModelConfig;
  querySchema: TQuerySchema;
  customFilters?: (searchParams: URLSearchParams, whereConditions: any) => void;
  beforeQuery?: (query: any) => any;
  afterQuery?: (results: any[]) => any[];
}

export function createGenericHandler<TQuerySchema extends z.ZodSchema>(
  options: ApiHandlerOptions<TQuerySchema>
) {
  return async function GET(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);

      // Validate query parameters using Zod schema
      const validation = validateQuery(options.querySchema, searchParams);

      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Invalid query parameters',
            validation: formatValidationErrors(validation.errors),
          },
          { status: 400 }
        );
      }

      const validatedParams = validation.data;

      // Build query using the generic query builder
      const queryBuilder = QueryBuilder.fromRequest(request, options.config);
      let query = queryBuilder.build();

      // Apply custom filters if provided
      if (options.customFilters) {
        const whereConditions = query.where || {};
        options.customFilters(searchParams, whereConditions);
        if (Object.keys(whereConditions).length > 0) {
          query.where = whereConditions;
        }
      }

      // Apply before query hook
      if (options.beforeQuery) {
        query = options.beforeQuery(query);
      }

      // Get the model from prisma
      const model = (prisma as any)[options.modelName];

      // Execute the query
      let results = await model.findMany(query);

      // Apply after query hook
      if (options.afterQuery) {
        results = options.afterQuery(results);
      }

      // Get total count for pagination info (if needed)
      let totalCount = null;

      if (validatedParams.includeTotalCount) {
        const countQuery = query.where ? { where: query.where } : undefined;
        totalCount = await model.count(countQuery);
      }

      // Build pagination info using validated parameters
      const { page, limit } = validatedParams;

      // Build response
      const response: any = {
        data: results,
        pagination: {
          page,
          limit,
          skip: query.skip,
          take: query.take,
        },
      };

      if (totalCount !== null) {
        response.pagination.totalCount = totalCount;
        response.pagination.totalPages = Math.ceil(totalCount / limit);
      }

      return NextResponse.json(response);
    } catch (error) {
      console.error(`Error fetching ${String(options.modelName)}:`, error);
      return NextResponse.json(
        {
          error: `Failed to fetch ${String(options.modelName)}`,
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  };
}

// Helper function to create model configs
export const createModelConfig = (config: ModelConfig): ModelConfig => config;
