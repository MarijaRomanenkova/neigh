'use client';

import { StarRatingDisplay } from '@/components/ui/star-rating-display';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExtendedUser } from '@/types';

interface UserRatingsProps {
  user: ExtendedUser;
}

/**
 * User Ratings Component
 * 
 * Displays the user's ratings as both a contractor/neighbour and as a client
 * 
 * @param {UserRatingsProps} props - Component properties
 * @returns {JSX.Element} The rendered user ratings component
 */
export default function UserRatings({ user }: UserRatingsProps) {
  // Convert Decimal values to numbers to ensure proper rendering
  const getNumericRating = (rating: number | { toString(): string } | null | undefined): number => {
    if (!rating) return 0;
    if (typeof rating === 'number') return rating;
    if (typeof rating === 'object' && rating !== null && 'toString' in rating) {
      return parseFloat(rating.toString());
    }
    return 0;
  };

  const contractorRating = getNumericRating(user.contractorRating);
  const clientRating = getNumericRating(user.clientRating);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Your Ratings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">As a Contractor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <StarRatingDisplay value={contractorRating} />
              <span className="text-sm text-muted-foreground">
                {contractorRating > 0 ? `${contractorRating.toFixed(1)}/5` : 'No ratings yet'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">As a Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <StarRatingDisplay value={clientRating} />
              <span className="text-sm text-muted-foreground">
                {clientRating > 0 ? `${clientRating.toFixed(1)}/5` : 'No ratings yet'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
