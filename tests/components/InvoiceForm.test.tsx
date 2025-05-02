// tests/components/InvoiceForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InvoiceForm from '../../components/shared/invoice/invoice-form';
import { createInvoice } from '../../lib/actions/invoice.actions';
import { getUserById } from '../../lib/actions/user.actions';

// Mock the necessary dependencies
jest.mock('../../lib/actions/invoice.actions', () => ({
  createInvoice: jest.fn().mockResolvedValue({ success: true, id: 'mock-invoice-id' }),
}));

jest.mock('../../lib/actions/user.actions', () => ({
  getUserById: jest.fn().mockImplementation((id) => {
    if (id === 'client-123') {
      return Promise.resolve({ id: 'client-123', name: 'Test Client', email: 'client@example.com' });
    } else if (id === 'contractor-456') {
      return Promise.resolve({ id: 'contractor-456', name: 'Test Contractor', email: 'contractor@example.com' });
    }
    return Promise.resolve({});
  }),
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
    
    // Check for section headers
    expect(screen.getByText('Client Information')).toBeInTheDocument();
    expect(screen.getByText('Contractor Information')).toBeInTheDocument();
    
    // Check for field labels
    expect(screen.getByText('Client Name')).toBeInTheDocument();
    expect(screen.getByText('Client Email')).toBeInTheDocument();
    expect(screen.getByText('Contractor Name')).toBeInTheDocument();
    expect(screen.getByText('Contractor Email')).toBeInTheDocument();
    
    // Check for buttons
    expect(screen.getByText('Add Item')).toBeInTheDocument();
    expect(screen.getByText('Create Invoice')).toBeInTheDocument();
    
    // Check for table headers
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Quantity')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
  });
  
  it('adds an item when the Add Item button is clicked', () => {
    render(<InvoiceForm type="Create" />);
    
    // Check for empty state message
    expect(screen.getByText('No invoice items added yet')).toBeInTheDocument();
    
    // Click add item
    fireEvent.click(screen.getByText('Add Item'));
    
    // Should now have description field
    expect(screen.getByPlaceholderText('Service description')).toBeInTheDocument();
    
    // Should have quantity and price inputs (number inputs)
    const numberInputs = screen.getAllByRole('spinbutton');
    expect(numberInputs.length).toBeGreaterThanOrEqual(2);
  });
  
  it('calculates total price when item price changes', async () => {
    render(<InvoiceForm type="Create" />);
    
    // Add an item
    fireEvent.click(screen.getByText('Add Item'));
    
    // Find price input
    const inputs = screen.getAllByRole('spinbutton');
    const quantityInput = inputs[0]; // First spinbutton is quantity
    const priceInput = inputs[1]; // Second spinbutton is price
    
    // Set quantity to 2
    fireEvent.change(quantityInput, { target: { value: '2' } });
    
    // Set price to 50
    fireEvent.change(priceInput, { target: { value: '50' } });
    
    // Wait for the total to update (100 = 2 * 50)
    await waitFor(() => {
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });
  });
  
  it('submits the form with correct data', async () => {
    render(<InvoiceForm 
      type="Create" 
      prefillData={{
        clientId: 'client-123',
        contractorId: 'contractor-456'
      }}
    />);
    
    // Add an item
    fireEvent.click(screen.getByText('Add Item'));
    
    // Get description, quantity and price inputs
    const descriptionInput = screen.getByPlaceholderText('Service description');
    const inputs = screen.getAllByRole('spinbutton');
    const quantityInput = inputs[0];
    const priceInput = inputs[1];
    
    // Update the values
    fireEvent.change(descriptionInput, { target: { value: 'Test Service' } });
    fireEvent.change(quantityInput, { target: { value: '3' } });
    fireEvent.change(priceInput, { target: { value: '75' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Invoice'));
    
    // Wait for the form submission and check if createInvoice was called
    await waitFor(() => {
      expect(createInvoice).toHaveBeenCalledWith(expect.objectContaining({
        clientId: 'client-123',
        contractorId: 'contractor-456',
        totalPrice: 225, // 3 * 75 = 225
      }));
    });
  });
  
  it('pre-fills data when provided', async () => {
    render(<InvoiceForm 
      type="Create" 
      prefillData={{
        clientId: 'client-123',
        clientName: 'Test Client',
        contractorId: 'contractor-456',
        taskId: 'task-789',
        taskName: 'Task Service',
        taskPrice: 100
      }}
    />);
    
    // Wait for user data to be fetched and displayed
    await waitFor(() => {
      // Should display client name
      const clientNameInput = screen.getByDisplayValue('Test Client');
      expect(clientNameInput).toBeInTheDocument();
      
      // Should display contractor name once fetched
      const contractorNameInput = screen.getByDisplayValue('Test Contractor');
      expect(contractorNameInput).toBeInTheDocument();
      
      // Should have pre-filled task
      const taskInput = screen.getByDisplayValue('Task Service');
      expect(taskInput).toBeInTheDocument();
      
      // Total should reflect pre-filled price
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });
  });
});
