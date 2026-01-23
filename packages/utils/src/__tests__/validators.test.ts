import { describe, it, expect } from 'vitest';
import { loginSchema, participantSchema } from '../validators';

describe('validators', () => {
  describe('loginSchema', () => {
    it('validates correct credentials', () => {
      const result = loginSchema.safeParse({
        email: 'admin@ephraimcare.com.au',
        password: 'validPassword123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'validPassword123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const result = loginSchema.safeParse({
        email: 'admin@ephraimcare.com.au',
        password: '12345',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty fields', () => {
      const result = loginSchema.safeParse({ email: '', password: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('participantSchema', () => {
    it('validates correct participant data', () => {
      const result = participantSchema.safeParse({
        ndis_number: '431000001',
        first_name: 'Alice',
        last_name: 'Johnson',
        date_of_birth: '1985-03-15',
        phone: '0412345001',
        email: 'alice@example.com',
        address_line_1: '15 George St',
        suburb: 'Liverpool',
        state: 'NSW',
        postcode: '2170',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing required fields', () => {
      const result = participantSchema.safeParse({
        first_name: 'Alice',
      });
      expect(result.success).toBe(false);
    });
  });
});
