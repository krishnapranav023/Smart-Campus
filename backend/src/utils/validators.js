import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  type: z.string().optional(),
  description: z.string().min(10),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  maxParticipants: z.coerce.number().int().positive().optional(),
  venueId: z.coerce.number().int().positive().optional(),
  institutionId: z.coerce.number().int().positive().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  institutionId: z.number().int().positive(),
  role: z.enum(['ADMIN', 'ORGANIZER', 'PARTICIPANT']).optional()
});

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.errors.map(e => ({ 
        field: e.path.join('.'), 
        message: e.message 
      }))
    });
  }
  req.body = result.data;
  next();
};
