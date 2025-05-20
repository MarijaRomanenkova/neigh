# C4 Model Architecture

## Level 1: System Context Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#000000', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#000000', 'lineColor': '#000000', 'secondaryColor': '#ffffff', 'tertiaryColor': '#f8fafc'}, 'flowchart': {'curve': 'basis', 'padding': 20}, 'fontFamily': 'Inter'}}%%
graph TB
    subgraph Users
        user[User<br/>Client & Contractor]
        admin[Admin]
    end

    subgraph System
        neighbours[Neighbours Platform]
    end

    subgraph External
        resend[Resend<br/>Email System]
        payment[Payment Systems<br/>PayPal & Stripe]
        uploadthing[UploadThing<br/>File Storage]
    end

    user --> neighbours
    admin --> neighbours
    neighbours --> resend
    neighbours --> payment
    neighbours --> uploadthing
```

## Level 2: Container Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#000000', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#000000', 'lineColor': '#000000', 'secondaryColor': '#ffffff', 'tertiaryColor': '#f8fafc'}, 'flowchart': {'curve': 'basis', 'padding': 20}, 'fontFamily': 'Inter'}}%%
graph TB
    subgraph Users
        user[User<br/>Client & Contractor]
        admin[Admin]
    end

    subgraph NeighboursPlatform[Neighbours Platform]
        web_app[Web Application<br/>Next.js, React<br/>+ Admin Routes/Views]
        api[API Application<br/>Next.js API Routes]
        websocket[WebSocket Server<br/>Socket.io]
        database[(Database<br/>PostgreSQL)]
    end

    subgraph External
        resend[Resend<br/>Email System]
        payment[Payment Systems<br/>PayPal & Stripe]
        uploadthing[UploadThing<br/>File Storage]
    end

    user --> web_app
    admin --> web_app
    web_app --> api
    web_app --> websocket
    api --> database
    websocket --> database
    api --> resend
    api --> payment
    api --> uploadthing
```

## Level 3: Component Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#000000', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#000000', 'lineColor': '#000000', 'secondaryColor': '#ffffff', 'tertiaryColor': '#f8fafc'}, 'flowchart': {'curve': 'basis', 'padding': 20}, 'fontFamily': 'Inter'}}%%
graph TB
    subgraph WebApp[Web Application]
        auth_ui[Auth UI<br/>Login/Register]
        profile_ui[Profile UI<br/>User Information]
        task_ui[Task UI<br/>Task Management]
        task_assignment_ui[Task Assignment UI<br/>Status & Invoicing]
        chat_ui[Chat UI<br/>Real-time Chat]
        payment_ui[Payment UI<br/>Checkout]
        admin_ui[Admin UI<br/>Dashboard]
    end

    subgraph API[API Application]
        auth[Authentication<br/>NextAuth.js]
        user_management[User Management<br/>Next.js API Routes]
        profile_api[Profile API<br/>User Information]
        task_api[Task API<br/>Task Creation/Listing]
        task_assignment_api[Task Assignment API<br/>Status Updates]
        invoice_api[Invoice API<br/>Payment Processing]
        chat_api[Chat API<br/>Next.js API Routes]
        payment_api[Payment API<br/>Next.js API Routes]
        notification[Notification Service<br/>Next.js API Routes]
    end

    subgraph WebSocket[WebSocket Server]
        chat_handler[Chat Handler<br/>Socket.io]
        status_handler[Status Handler<br/>Task Status Updates]
        notification_handler[Notification Handler<br/>Socket.io]
    end

    database[(Database<br/>PostgreSQL)]

    %% Web App to API connections
    auth_ui --> auth
    profile_ui --> profile_api
    task_ui --> task_api
    task_assignment_ui --> task_assignment_api
    task_assignment_ui --> invoice_api
    chat_ui --> chat_api
    payment_ui --> payment_api
    admin_ui --> user_management
    admin_ui --> task_api
    admin_ui --> task_assignment_api
    admin_ui --> profile_api

    %% Web App to WebSocket connections
    chat_ui --> chat_handler
    task_assignment_ui --> status_handler
    auth_ui --> notification_handler
    task_assignment_ui --> notification_handler

    %% API Component interactions
    auth --> user_management
    user_management --> profile_api
    profile_api --> invoice_api
    task_api --> task_assignment_api
    task_assignment_api --> invoice_api
    task_api --> notification
    task_assignment_api --> notification
    chat_api --> notification
    payment_api --> notification
    user_management --> notification
    invoice_api --> payment_api

    %% API to Database
    auth --> database
    user_management --> database
    profile_api --> database
    task_api --> database
    task_assignment_api --> database
    invoice_api --> database
    chat_api --> database
    payment_api --> database
    notification --> database

    %% WebSocket to Database
    chat_handler --> database
    status_handler --> database
    notification_handler --> database

    %% WebSocket Component interactions
    chat_handler --> notification_handler
    status_handler --> notification_handler
```

## Level 4: Code Diagram (Task Assignment Component)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#000000', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#000000', 'lineColor': '#000000', 'secondaryColor': '#ffffff', 'tertiaryColor': '#f8fafc'}, 'flowchart': {'curve': 'basis', 'padding': 20}, 'fontFamily': 'Inter'}}%%
graph TB
    subgraph TaskAssignment[Task Assignment Component]
        actions[Task Assignment Actions<br/>Server Actions]
        status_actions[Status Actions<br/>Server Actions]
        components[UI Components<br/>React Components]
    end

    subgraph Actions[Server Actions]
        create_assignment[createTaskAssignment<br/>Creates new assignment]
        update_status[updateTaskAssignmentStatus<br/>Updates task status]
        accept_task[acceptTaskAssignment<br/>Client accepts task]
        mark_reviewed[markTaskAsReviewed<br/>Adds review]
        mark_client_reviewed[markClientAsReviewed<br/>Adds client review]
    end

    subgraph Components[UI Components]
        status_buttons[StatusUpdateButtons<br/>Status change UI]
        assignment_form[TaskAssignmentForm<br/>Assignment creation]
        assignment_details[TaskAssignmentDetails<br/>Assignment view]
        assignment_card[TaskAssignmentCard<br/>Assignment list item]
        review_task[ReviewTaskDialog<br/>Task review UI]
        review_client[ReviewClientDialog<br/>Client review UI]
    end

    database[(Database<br/>PostgreSQL)]
    websocket[WebSocket Server]

    %% Action to Database
    create_assignment --> database
    update_status --> database
    accept_task --> database
    mark_reviewed --> database
    mark_client_reviewed --> database

    %% Component to Action
    status_buttons --> update_status
    assignment_form --> create_assignment
    assignment_details --> accept_task
    review_task --> mark_reviewed
    review_client --> mark_client_reviewed

    %% Action to WebSocket
    create_assignment --> websocket
    update_status --> websocket
    accept_task --> websocket
    mark_reviewed --> websocket
    mark_client_reviewed --> websocket

    %% Status Flow
    create_assignment -->|"Status: IN_PROGRESS"| update_status
    update_status -->|"Status: COMPLETED"| accept_task
    accept_task -->|"Status: ACCEPTED"| mark_reviewed
    accept_task -->|"Status: ACCEPTED"| mark_client_reviewed
```

## Key Features by Component

### Web Application
- User interface for clients/contractors
- Admin interface (routes/views)
- Profile management
- Task creation and management
- Task assignment and status tracking
- Invoice generation and payment
- Real-time chat interface
- Payment processing interface

### API Application
- Authentication and authorization
- User and role management
- Profile management
- Task management and assignment
- Invoice generation and processing
- Chat functionality
- Payment processing
- Notification system

### WebSocket Server
- Real-time chat
- Task status updates
- Real-time notifications

### Database
- User data and roles
- Profile information
- Task data and assignments
- Invoice data
- Chat messages
- Payment transactions
- Reviews and ratings
