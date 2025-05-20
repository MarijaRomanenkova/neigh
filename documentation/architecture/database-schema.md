# Database Schema

## Entity Relationship Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#000000', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#000000', 'lineColor': '#000000', 'secondaryColor': '#ffffff', 'tertiaryColor': '#f8fafc'}, 'flowchart': {'curve': 'basis', 'padding': 20}, 'er': {'layoutDirection': 'TB', 'minEntityWidth': 100, 'entityPadding': 15, 'stroke': '#000000', 'fill': '#ffffff', 'align': 'left'}, 'fontFamily': 'Inter'}}%%
erDiagram
    User {
        uuid id PK
        string name
        string email
        string password
        string role
        datetime createdAt
        datetime updatedAt
    }

    Task {
        uuid id PK
        string name
        string description
        decimal price
        uuid createdById FK
        uuid categoryId FK
        datetime createdAt
        datetime updatedAt
    }

    TaskAssignment {
        uuid id PK
        uuid taskId FK
        uuid clientId FK
        uuid contractorId FK
        uuid statusId FK
        datetime createdAt
        datetime completedAt
    }

    TaskAssignmentStatus {
        uuid id PK
        string name
        string color
    }

    Category {
        uuid id PK
        string name
        string description
    }

    Review {
        uuid id PK
        uuid assignmentId FK
        uuid reviewerId FK
        uuid revieweeId FK
        uuid typeId FK
        int rating
        string description
        datetime createdAt
    }

    ReviewType {
        uuid id PK
        string name
        string description
    }

    Invoice {
        uuid id PK
        string invoiceNumber
        uuid paymentId FK
        datetime createdAt
    }

    InvoiceItem {
        uuid id PK
        uuid invoiceId FK
        uuid assignmentId FK
        decimal amount
    }

    Payment {
        uuid id PK
        boolean isPaid
        string paymentMethod
        datetime paidAt
    }

    %% Main relationships
    User ||--o{ Task : creates
    User ||--o{ TaskAssignment : "assigned as client"
    User ||--o{ TaskAssignment : "assigned as contractor"
    User ||--o{ Review : "leaves review"
    User ||--o{ Review : "receives review"
    
    Task ||--o{ TaskAssignment : has
    Task }o--|| Category : belongs_to
    
    TaskAssignment ||--o{ Review : has
    TaskAssignment }o--|| TaskAssignmentStatus : has
    TaskAssignment ||--o{ InvoiceItem : has
    
    Review }o--|| ReviewType : has
    
    Invoice ||--o{ InvoiceItem : contains
    Invoice }o--|| Payment : has
```

## Key Relationships

1. **User Relationships**
   - Users can create multiple tasks
   - Users can be clients or contractors in task assignments
   - Users can leave and receive reviews

2. **Task Relationships**
   - Tasks belong to a category
   - Tasks can have multiple assignments
   - Tasks are created by users

3. **Task Assignment Relationships**
   - Assignments have a status
   - Assignments can have reviews
   - Assignments can have invoice items

4. **Review Relationships**
   - Reviews are associated with task assignments
   - Reviews have a type (Client Review or Contractor Review)
   - Reviews connect reviewers and reviewees

5. **Invoice Relationships**
   - Invoices contain multiple invoice items
   - Invoices are linked to payments
   - Invoice items are linked to task assignments

## Status Flow

Task assignments go through the following statuses:
1. IN_PROGRESS - When task is assigned
2. COMPLETED - When contractor marks task as done
3. ACCEPTED - When client accepts completed task

## Review Types

1. Client Review - Review from client to contractor
2. Contractor Review - Review from contractor to client
