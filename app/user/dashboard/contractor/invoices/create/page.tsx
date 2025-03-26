'use client';

import InvoiceForm from '@/components/shared/invoice/invoice-form';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getTaskById } from '@/lib/actions/task.actions';
import { getUserById } from '@/lib/actions/user.actions';

const CreateInvoicePage = () => {
  const searchParams = useSearchParams();
  const taskId = searchParams.get('taskId');
  const clientId = searchParams.get('clientId');
  const { data: session } = useSession();
  
  const [prefillData, setPrefillData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Initialize data with contractor ID from session
        const data: any = {
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
  
  return (
    <>
      <h2 className='h2-bold'>Create Invoice</h2>
      <div className='my-8'>
        <InvoiceForm type='Create' prefillData={prefillData} />
      </div>
    </>
  );
};

export default CreateInvoicePage;
