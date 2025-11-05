import z from "zod";

export const taskCreated = z.object({
  errorId: z.number(),
  taskId: z.number(),
});

export const taskRetrieved = z.union([
  z.object({
    errorId: z.literal(0),
    status: z.literal("processing"),
  }),
  z.object({
    errorId: z.literal(0),
    status: z.literal("ready"),
    solution: z.object({
      token: z.string(),
    }),
  }),
]);

export const regitraInsurance = z.object({
  vehicleMake: z.string(),
  vehicleCommercialName: z.string(),
  statusCode: z.union([
    z.literal("R"),
    z.literal("N"),
    z.literal("D"),
    z.literal("A"),
  ]),
  trafficParticipationStatus: z.boolean(),
  trafficSuspenseDateUntil: z.string().nullable(),
  technicalInspectionValid: z.boolean(),
  technicalInspectionValidFrom: z.string().nullable(),
  technicalInspectionValidUntil: z.string().nullable(),
  civilInsuranceValid: z.boolean(),
  vehicleWanted: z.boolean(),
});

export const regitraInsuranceError = z.object({
  message: z.string(),
});

export const regitraVin = z.object({
  vehicleMake: z.string(),
  vehicleCommercialName: z.string(),
  vehicleVin: z.string().length(17),
});
