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
              <StarRatingDisplay value={user.contractorRating || 0} />
              <span className="text-sm text-muted-foreground">
                {user.contractorRating ? `${user.contractorRating.toFixed(1)}/5` : 'No ratings yet'}
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
              <StarRatingDisplay value={user.clientRating || 0} />
              <span className="text-sm text-muted-foreground">
                {user.clientRating ? `${user.clientRating.toFixed(1)}/5` : 'No ratings yet'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
