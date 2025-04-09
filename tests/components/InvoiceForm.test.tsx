// tests/components/InvoiceForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InvoiceForm from '../../components/shared/invoice/invoice-form';
import { createInvoice } from '../../lib/actions/invoice.actions';

// Mock the necessary dependencies
jest.mock('../../lib/actions/invoice.actions', () => ({
  createInvoice: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('InvoiceForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders all form fields correctly', () => {
    render(<InvoiceForm type="Create" />);
    
    expect(screen.getByLabelText(/Client ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contractor ID/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Item/i)).toBeInTheDocument();
  });
  
  it('adds an item when the Add Item button is clicked', () => {
    render(<InvoiceForm type="Create" />);
    
    // Initially no items
    expect(screen.queryByRole('cell')).not.toBeInTheDocument();
    
    // Click add item
    fireEvent.click(screen.getByText('Add Item'));
    
    // Should now have cells for the item row
    expect(screen.getAllByRole('cell').length).toBeGreaterThan(0);
  });
  
  it('calculates total price when item price changes', () => {
    render(<InvoiceForm type="Create" />);
    
    // Add an item
    fireEvent.click(screen.getByText('Add Item'));
    
    // Find price input and update it
    const priceInput = screen.getByRole('cell', { name: /price/i }).querySelector('input');
    if (!priceInput) throw new Error('Price input not found');
    fireEvent.change(priceInput, { target: { value: '100' } });
    
    // Check that the total was updated
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });
  
  it('submits the form with correct data', async () => {
    (createInvoice as jest.Mock).mockResolvedValue({ success: true });
    
    render(<InvoiceForm type="Create" />);
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Client ID/i), { target: { value: 'client-123' } });
    fireEvent.change(screen.getByLabelText(/Contractor ID/i), { target: { value: 'contractor-456' } });
    
    // Add an item
    fireEvent.click(screen.getByText('Add Item'));
    
    // Find and fill task ID, price and quantity
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[2], { target: { value: 'task-789' } }); // Task ID
    fireEvent.change(inputs[4], { target: { value: '100' } }); // Price
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Invoice'));
    
    await waitFor(() => {
      expect(createInvoice).toHaveBeenCalledWith({
        clientId: 'client-123',
        contractorId: 'contractor-456',
        items: [{ taskId: 'task-789', price: 100, quantity: 1 }],
        totalPrice: 100
      });
    });
  });
});
