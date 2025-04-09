// tests/invoice-calculation.test.ts
import { calcTotal } from '../lib/actions/invoice.actions';

describe('Invoice Calculations', () => {
  it('calculates correct totals for invoice items', () => {
    // Arrange
    const items = [
      { taskId: 'task1', price: 100, quantity: 2 },
      { taskId: 'task2', price: 50, quantity: 1 }
    ];
    
    // Act
    const result = calcTotal(items);
    
    // Assert
    expect(result.subtotal).toBe('250.00');
    expect(result.total).toBe('302.50'); // Including 21% tax
  });
  
  it('handles zero quantity items', () => {
    const items = [
      { taskId: 'task1', price: 100, quantity: 0 }
    ];
    
    const result = calcTotal(items);
    
    expect(result.subtotal).toBe('0.00');
    expect(result.total).toBe('0.00');
  });
  
  it('handles empty items array', () => {
    const result = calcTotal([]);
    
    expect(result.subtotal).toBe('0.00');
    expect(result.total).toBe('0.00');
  });
  
  it('handles both qty and quantity fields', () => {
    const items = [
      { taskId: 'task1', price: 100, quantity: 2 },
      { taskId: 'task2', price: 50, qty: 3 }
    ];
    
    const result = calcTotal(items);
    
    expect(result.subtotal).toBe('350.00'); // 100*2 + 50*3
    expect(result.total).toBe('423.50'); // Including 21% tax
  });
});
