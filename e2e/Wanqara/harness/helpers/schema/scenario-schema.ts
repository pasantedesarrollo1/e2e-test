import { z } from 'zod';

const LoginModeSchema = z.enum(['fresh', 'cached', '']).default('cached');

const BaseScenarioSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "El campo 'description' es obligatorio"),
  skip: z.boolean().optional(),
  skipReason: z.string().optional(),
  only: z.boolean().optional(),
  authType: z.string().optional(),
  loginMode: LoginModeSchema.optional(),
  metadata: z.object({
    ws: z.union([z.string(), z.array(z.string())]).nullable().optional(),
    tes: z.string().optional(),
    release: z.string().optional(),
    summary: z.string().optional(),
    addedToRegression: z.string().optional(),
    testScope: z.string().optional(),
  }).optional(),
});

const AdminScenarioSchema = BaseScenarioSchema.extend({
  fixture: z.literal('admin'),
  subsidiaryName: z.string().optional(),
  subsidiaryCode: z.string().optional(),
}).passthrough();

const PosScenarioSchema = BaseScenarioSchema.extend({
  fixture: z.literal('pos'),
  subsidiaryName: z.string().optional(),
  subsidiaryCode: z.string().optional(),
  openingAmount: z.string().optional(),
  businessType: z.enum(['Restaurante', 'Retail', 'Comercios', '']).optional(),
  dispatchEnabled: z.boolean().optional(),
  cashRegisterMode: z.enum(['ensure-open', 'ensure-closed', 'fresh', '']).optional(),
}).passthrough();

const StageScenarioSchema = BaseScenarioSchema.extend({
  fixture: z.literal('stage'),
  subsidiaryName: z.string().optional(),
  subsidiaryCode: z.string().optional(),
  openingAmount: z.string().optional(),
  chefAuthType: z.string().optional(),
  stageSetupOptions: z.any().optional(),
}).passthrough();

export const ScenarioArraySchema = z.discriminatedUnion('fixture', [
  AdminScenarioSchema,
  PosScenarioSchema,
  StageScenarioSchema,
]);

export function parseScenarios<T>(rawData: unknown): T[] {
  const result = ScenarioArraySchema.array().safeParse(rawData);
  if (!result.success) {
    const errors = result.error.issues.map(e =>
      `  ÍÍndice ${e.path.join('.')}: ${e.message}`
    ).join('\n');
    throw new Error(`❌ JSON de escenarios inválido:\n${errors}`);
  }
  return result.data as T[];
}



