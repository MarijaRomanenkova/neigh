// tests/form-validation.test.ts
import { insertInvoiceSchema, updateTaskSchema } from '../lib/validators';

describe('Form Validation Schemas', () => {
  describe('Invoice Schema', () => {
    it('validates a valid invoice', () => {
      const validInvoice = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        contractorId: '123e4567-e89b-12d3-a456-426614174001',
        totalPrice: 250,
        items: [
          { taskId: '123e4567-e89b-12d3-a456-426614174002', quantity: 2, price: 100 },
          { taskId: '123e4567-e89b-12d3-a456-426614174003', quantity: 1, price: 50 }
        ]
      };
      
      const result = insertInvoiceSchema.safeParse(validInvoice);
      expect(result.success).toBe(true);
    });
    
    it('fails when required fields are missing', () => {
      const invalidInvoice = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        // Missing contractorId
        totalPrice: 250,
        items: []
      };
      
      const result = insertInvoiceSchema.safeParse(invalidInvoice);
      expect(result.success).toBe(false);
    });
    
    it('fails when items have invalid data', () => {
      const invalidInvoice = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        contractorId: '123e4567-e89b-12d3-a456-426614174001',
        totalPrice: 250,
        items: [
          { taskId: '123e4567-e89b-12d3-a456-426614174002', quantity: -1, price: 100 } // Negative quantity
        ]
      };
      
      const result = insertInvoiceSchema.safeParse(invalidInvoice);
      expect(result.success).toBe(false);
    });
  });
  
  describe('Task Update Schema', () => {
    it('validates a valid task update', () => {
      const validTask = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Updated Task Name',
        categoryId: '123e4567-e89b-12d3-a456-426614174001',
        images: ['image1.jpg', 'image2.jpg'],
        description: 'This is a detailed task description with more than 12 characters',
        price: 200
      };
      
      const result = updateTaskSchema.safeParse(validTask);
      if (!result.success) {
        console.log('Validation errors:', result.error.errors);
      }
      expect(result.success).toBe(true);
    });
    
    it('fails when description is too short', () => {
      const invalidTask = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Updated Task Name',
        categoryId: '123e4567-e89b-12d3-a456-426614174001',
        images: ['image1.jpg'],
        description: 'Too short', // Less than 12 characters
        price: 200
      };
      
      const result = updateTaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });
  });
});
