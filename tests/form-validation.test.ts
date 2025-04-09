// tests/form-validation.test.ts
import { insertInvoiceSchema, updateTaskSchema } from '../lib/validators';

describe('Form Validation Schemas', () => {
  describe('Invoice Schema', () => {
    it('validates a valid invoice', () => {
      const validInvoice = {
        clientId: 'client-123',
        contractorId: 'contractor-456',
        totalPrice: 250,
        items: [
          { taskId: 'task-789', quantity: 2, price: 100 },
          { taskId: 'task-101', quantity: 1, price: 50 }
        ]
      };
      
      const result = insertInvoiceSchema.safeParse(validInvoice);
      expect(result.success).toBe(true);
    });
    
    it('fails when required fields are missing', () => {
      const invalidInvoice = {
        clientId: 'client-123',
        // Missing contractorId
        totalPrice: 250,
        items: []
      };
      
      const result = insertInvoiceSchema.safeParse(invalidInvoice);
      expect(result.success).toBe(false);
    });
    
    it('fails when items have invalid data', () => {
      const invalidInvoice = {
        clientId: 'client-123',
        contractorId: 'contractor-456',
        totalPrice: 250,
        items: [
          { taskId: 'task-789', quantity: -1, price: 100 } // Negative quantity
        ]
      };
      
      const result = insertInvoiceSchema.safeParse(invalidInvoice);
      expect(result.success).toBe(false);
    });
  });
  
  describe('Task Update Schema', () => {
    it('validates a valid task update', () => {
      const validTask = {
        id: 'task-123',
        name: 'Updated Task Name',
        slug: 'updated-task-name',
        categoryId: 'category-456',
        images: ['image1.jpg', 'image2.jpg'],
        description: 'This is a detailed task description with more than 12 characters',
        price: 200
      };
      
      const result = updateTaskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });
    
    it('fails when description is too short', () => {
      const invalidTask = {
        id: 'task-123',
        name: 'Updated Task Name',
        slug: 'updated-task-name',
        categoryId: 'category-456',
        images: ['image1.jpg'],
        description: 'Too short', // Less than 12 characters
        price: 200
      };
      
      const result = updateTaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });
  });
});
