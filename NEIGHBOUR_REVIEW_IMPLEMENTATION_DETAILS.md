# Neighbour Review Implementation

This document explains how the neighbor review system has been implemented in the application.

## Overview

In our application, "contractors" are referred to as "neighbours" in the user interface to better reflect the community-focused nature of the application. The implementation leverages the existing data model and review system, with updated UI components and terminology.

## Implementation Details

### Data Model

- We reuse the existing data model where:
  - `clientId` refers to the person requesting help
  - `contractorId` refers to the neighbor performing the task

- We utilize the existing review types:
  - "Client Review" for client reviewing neighbors
  - "Contractor Review" for neighbors reviewing clients

### UI Components

1. **ReviewNeighbourDialog** - A specialized dialog component for reviewing neighbors that:
   - Uses the neighbor-specific terminology
   - Utilizes the existing `markTaskAsReviewed` action for submitting reviews
   - Provides feedback specific to neighbors

2. **TaskAssignmentDetails** - Updated to:
   - Display "Neighbour" instead of "Contractor" in the UI
   - Use the `ReviewNeighbourDialog` for client reviews
   - Show consistent terminology throughout

### Key Files Modified

- `components/shared/task-assignment/review-neighbour-dialog.tsx` (new)
- `components/shared/task-assignment/task-assignment-details.tsx`
- `components/shared/task-assignment/review-task-dialog.tsx`
- `lib/actions/task-assignment.actions.ts`

## User Experience

### For Clients
- Clients can review neighbors who performed tasks
- The review interface uses neighbor-specific terminology
- Reviews contribute to the neighbor's overall rating

### For Neighbors
- Neighbors receive notifications when clients review them
- Reviews appear on their profiles
- Accumulated ratings help build reputation in the community

## Technical Notes

- We've retained the existing database structure and API calls
- Changes are primarily UI-focused to better reflect terminology
- The feature is now fully enabled with `ENABLE_NEIGHBOUR_REVIEWS = true`

## Future Improvements

- Profile pages could be enhanced to better showcase neighbor ratings
- Search and filtering based on neighbor ratings could be added
- More detailed review metrics (reliability, communication, etc.) could be implemented 
