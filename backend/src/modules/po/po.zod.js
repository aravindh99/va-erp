import { z } from "zod";

export const createPoSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  orderDate: z.string().refine(val => !isNaN(Date.parse(val)), {
  message: "Invalid date format",
  }),

  gstInclude: z.boolean(),
  gstPercent: z.number().min(0).max(100).optional(),
  supplierId: z.string().uuid("Invalid supplier ID format"),
  addressId: z.string().uuid("Invalid address ID format").optional(),
  shippingAddressId: z.string().uuid("Invalid address ID format").optional(),
  notes: z.string().max(5000).optional(),
  status: z.enum(["pending", "received"]).optional(),
  receivedBy: z.string().optional(),
  receivedAt: z.string().datetime().optional(),
  items: z
    .array(
      z.object({
        itemId: z.string().uuid("Invalid item ID"),
        quantity: z.number().int().positive(),
        rate: z.number().positive(),
      })
    )
    .min(1, "At least one item required"),
});

// export const updatePoSchema = createPoSchema.partial();

export const updatePoSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required").optional(),
  orderDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }).optional(),
  gstInclude: z.boolean().optional(),
  gstPercent: z.number().min(0).max(100).optional(),
  supplierId: z.string().uuid("Invalid supplier ID format").optional(),
  addressId: z.string().uuid("Invalid address ID format").optional(),
  shippingAddressId: z.string().uuid("Invalid address ID format").optional(),
  notes: z.string().max(5000).optional(),
  status: z.enum(["pending", "received"]).optional(),
  receivedBy: z.string().optional(),
  receivedAt: z.string().datetime().optional(),
  items: z
    .array(
      z.object({
        itemId: z.string().uuid("Invalid item ID"),
        quantity: z.number().int().positive(),
        rate: z.number().positive(),
      })
    )
    .optional(),
});


export const deletePoSchema = z.object({});
