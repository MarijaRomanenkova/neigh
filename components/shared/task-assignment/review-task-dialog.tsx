/**
 * Review Task Dialog Component
 * @module Components
 * @group Shared/TaskAssignment
 * 
 * A client-side dialog component that allows clients to review completed tasks.
 * Features include:
 * - Star rating system
 * - Optional feedback text
 * - Edit mode for updating existing reviews
 * - Loading states for data fetching
 * - Error handling with toast notifications
 * - Automatic refresh after submission
 * 
 * @example
 * ```tsx
 * <ReviewTaskDialog
 *   taskAssignmentId="task123"
 *   taskName="Garden Maintenance"
 *   isEditMode={false}
 * >
 *   <Button>Review Task</Button>
 * </ReviewTaskDialog>
 * ```
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import { useToast } from "@/hooks/use-toast";
import { markTaskAsReviewed, getClientReviewOfTask } from "@/lib/actions/task-assignment.actions";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

/**
 * Props for the ReviewTaskDialog component
 * @interface ReviewTaskDialogProps
 */
interface ReviewTaskDialogProps {
  /** Unique identifier of the task assignment */
  taskAssignmentId: string;
  /** Name of the task being reviewed */
  taskName: string;
  /** Optional trigger element to open the dialog */
  children?: ReactNode;
  /** Whether the dialog is in edit mode */
  isEditMode?: boolean;
}

/**
 * ReviewTaskDialog component that provides a form for clients to review completed tasks.
 * Supports both creating new reviews and editing existing ones.
 * 
 * @param {ReviewTaskDialogProps} props - Component properties
 * @returns {JSX.Element} A dialog with a review form
 */
export default function ReviewTaskDialog({ 
  taskAssignmentId, 
  taskName, 
  children,
  isEditMode = false
}: ReviewTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // If in edit mode, fetch the existing review data when dialog opens
  useEffect(() => {
    if (open && isEditMode) {
      const fetchExistingReview = async () => {
        try {
          setIsLoading(true);
          // Use the server action instead of fetch
          const result = await getClientReviewOfTask(taskAssignmentId);
          
          if (result.success && result.data) {
            setRating(result.data.rating);
            setFeedback(result.data.feedback || "");
          } else {
            // If no review found in edit mode, show a message
            if (isEditMode) {
              toast({
                title: "No review found",
                description: "Unable to load the existing review. You may create a new one.",
                variant: "destructive"
              });
            }
          }
        } catch (error) {
          console.error("Error fetching review:", error);
          toast({
            title: "Error",
            description: "Failed to load existing review",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchExistingReview();
    }
  }, [open, isEditMode, taskAssignmentId, toast]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please provide a rating before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Call the action to submit the review
      const result = await markTaskAsReviewed(taskAssignmentId, rating, feedback);
      
      if (result.success) {
        toast({
          title: "Success",
          description: isEditMode 
            ? "Review updated successfully." 
            : "Review submitted successfully. A notification has been sent to the neighbour."
        });
        setOpen(false);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to submit review",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="default" className="w-full">
            {isEditMode ? "Edit Review" : "Submit Review"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit" : "Review"} Task: {taskName}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 text-center">Loading review data...</div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="rating" className="text-sm font-medium leading-none">
                Rating
              </label>
              <StarRating
                value={rating}
                onChange={setRating}
                size={24}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="feedback" className="text-sm font-medium leading-none">
                Feedback (optional)
              </label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience working with the contractor..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading || rating === 0}
          >
            {isSubmitting ? "Submitting..." : isEditMode ? "Update Review" : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
