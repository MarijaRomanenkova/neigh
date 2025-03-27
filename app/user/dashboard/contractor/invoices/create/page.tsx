'use client';

/**
 * Invoice Creation Page Component
 * @module Pages
 * @group Dashboard/Contractor
 * 
 * This client-side page allows contractors to create new invoices.
 * It supports pre-filling data from task and client information passed via URL parameters.
 */

import InvoiceForm from '@/components/shared/invoice/invoice-form';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getTaskById } from '@/lib/actions/task.actions';
import { getUserById } from '@/lib/actions/user.actions';
import { Prisma } from '@prisma/client';

/**
 * Interface for the prefill data used in invoice creation
 * @interface PrefillData
 * @property {string} [contractorId] - ID of the contractor creating the invoice
 * @property {string} [taskId] - ID of the task for the invoice
 * @property {string} [taskName] - Name of the task
 * @property {number|string|Prisma.Decimal} [taskPrice] - Price of the task
 * @property {string} [clientId] - ID of the client for the invoice
 * @property {string} [clientName] - Name of the client
 * @property {string} [taskAssignmentId] - ID of the task assignment
 */
interface PrefillData {
  contractorId?: string;
  taskId?: string;
  taskName?: string;
  taskPrice?: number | string | Prisma.Decimal;
  clientId?: string;
  clientName?: string;
  taskAssignmentId?: string;
}

/**
 * Create Invoice Page Component
 * 
 * Renders a form for creating new invoices with:
 * - Optional pre-filling from task details
 * - Optional pre-filling from client details
 * - Automatic contractor association
 * 
 * Uses URL search parameters to determine what data to pre-fill.
 * Fetches related task and client data to populate the form.
 * Shows a loading state while fetching data.
 * 
 * @returns {JSX.Element} The rendered invoice creation form
 */
const CreateInvoicePage = () => {
  const searchParams = useSearchParams();
  const taskId = searchParams.get('taskId');
  const clientId = searchParams.get('clientId');
  const { data: session } = useSession();
  
  const [prefillData, setPrefillData] = useState<PrefillData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetches task and client data to pre-fill the invoice form
   * Runs when component mounts and when session, taskId, or clientId change
   */
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Initialize data with contractor ID from session
        const data: PrefillData = {
          contractorId: session?.user?.id
        };
        
        // If we have a task ID, fetch task details
        if (taskId) {
          const taskDetails = await getTaskById(taskId);
          if (taskDetails) {
            data.taskId = taskId;
            data.taskName = taskDetails.name;
            data.taskPrice = taskDetails.price;
          }
        }
        
        // If we have a client ID, fetch client details
        if (clientId) {
          const clientDetails = await getUserById(clientId);
          if (clientDetails) {
            data.clientId = clientId;
            data.clientName = clientDetails.name;
          }
        }
        
        setPrefillData(data);
      } catch (error) {
        console.error("Error fetching prefill data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session?.user?.id) {
      fetchData();
    }
  }, [taskId, clientId, session]);
  
  if (isLoading) {
    return <div className="p-8 text-center">Loading invoice data...</div>;
  }
  
  // Convert Decimal to string for the InvoiceForm component
  const formattedPrefillData = prefillData ? {
    ...prefillData,
    taskPrice: prefillData.taskPrice ? String(prefillData.taskPrice) : undefined
  } : undefined;
  
  return (
    <>
      <h2 className='h2-bold'>Create Invoice</h2>
      <div className='my-8'>
        <InvoiceForm type='Create' prefillData={formattedPrefillData} />
      </div>
    </>
  );
};

export default CreateInvoicePage;
