# Diagram Arsitektur: Department, Teams, dan Organizer

## 1. User Hierarchy dan Department Structure

```mermaid
graph TD
    A[SUPER_ADMIN] --> B[CUSTOMER_SUCCESS]
    A --> C[OPERATIONS]
    A --> D[FINANCE]
    
    B --> B1[CS_HEAD]
    B1 --> B2[CS_SENIOR_AGENT]
    B2 --> B3[CS_AGENT]
    
    C --> C1[OPS_HEAD]
    C1 --> C2[OPS_SENIOR_AGENT]
    C2 --> C3[OPS_AGENT]
    
    D --> D1[FINANCE_HEAD]
    D1 --> D2[FINANCE_SENIOR_AGENT]
    D2 --> D3[FINANCE_AGENT]
    
    style A fill:#ff6b6b
    style B fill:#4ecdc4
    style C fill:#45b7d1
    style D fill:#f7b731
```

## 2. Team Structure dan Auto-Assignment

```mermaid
graph LR
    A[DepartmentTicket] --> B{Category}
    B -->|PAYMENT_ISSUE| C[Team: PAYMENT_FINANCE]
    B -->|TECHNICAL_ISSUE| D[Team: TECHNICAL_SUPPORT]
    B -->|GENERAL_INQUIRY| E[Team: GENERAL_SUPPORT]
    
    C --> C1[TeamMember: CS_AGENT 1]
    C --> C2[TeamMember: CS_AGENT 2]
    C --> C3[TeamMember: CS_AGENT 3]
    
    D --> D1[TeamMember: CS_AGENT 4]
    D --> D2[TeamMember: CS_AGENT 5]
    
    E --> E1[TeamMember: CS_AGENT 6]
    E --> E2[TeamMember: CS_AGENT 7]
    
    C1 --> F[Assign Ticket]
    D1 --> F
    E1 --> F
    
    style A fill:#ff6b6b
    style C fill:#4ecdc4
    style D fill:#45b7d1
    style E fill:#f7b731
```

## 3. Flow User Biasa ke Organizer

```mermaid
sequenceDiagram
    participant U as User (PARTICIPANT)
    participant API as Upgrade API
    participant S as SmartAssignmentService
    participant A as Agent (OPS_AGENT)
    participant O as Organizer (APPROVED)
    
    U->>API: POST /api/upgrade/business
    API->>API: Validate User is PARTICIPANT
    API->>API: Update role to ORGANIZER
    API->>API: Set verificationStatus = PENDING
    API->>API: Create Profile (Individual/Business/Community/Institution)
    API->>S: assignToBestAgent('ORGANIZER', userId)
    S->>S: Get Available Agents
    S->>S: Calculate Workload
    S->>S: Select Best Agent (WORKLOAD_BASED)
    S->>API: Assign to Agent
    API->>A: Send Notification
    API->>U: Return Success (PENDING)
    
    A->>API: Review Organizer
    A->>API: POST /api/organizers/:id/approve
    API->>API: Update verificationStatus = APPROVED
    API->>API: Set verifiedAt = now()
    API->>O: Send Approval Email
    API->>A: Return Success
    
    O->>API: Create Event
    API->>API: Event Status = DRAFT
    API->>O: Return Event Created
```

## 4. Organizer Verification Flow

```mermaid
stateDiagram-v2
    [*] --> PARTICIPANT: User Registration
    
    PARTICIPANT --> UPGRADE_REQUEST: POST /api/upgrade/business
    UPGRADE_REQUEST --> PENDING: Auto-Assign to Agent
    
    PENDING --> ASSIGNED: SmartAssignmentService
    ASSIGNED --> UNDER_REVIEW: Agent Reviews
    
    UNDER_REVIEW --> APPROVED: Agent Approves
    UNDER_REVIEW --> REJECTED: Agent Rejects
    
    APPROVED --> CAN_CREATE_EVENTS: Organizer Can Create Events
    REJECTED --> [*]: Organizer Rejected
    
    CAN_CREATE_EVENTS --> [*]: Organizer Active
```

## 5. Team Assignment Flow

```mermaid
flowchart TD
    A[Contact Form] --> B[Create DepartmentTicket]
    B --> C{Get Ticket Category}
    C --> D[Find Team by Category]
    D --> E{Team Found?}
    E -->|Yes| F[Get Team Members]
    E -->|No| G[Assign to General Support]
    F --> H[Select Random Team Member]
    G --> H
    H --> I[Update ticket.assignedTo]
    I --> J[Create TeamAssignment]
    J --> K[Send Notification to Agent]
    K --> L[Ticket Assigned]
    
    style A fill:#ff6b6b
    style B fill:#4ecdc4
    style D fill:#45b7d1
    style H fill:#f7b731
    style L fill:#95e1d3
```

## 6. Organizer Auto-Assignment Flow

```mermaid
flowchart TD
    A[User Upgrade to ORGANIZER] --> B[SmartAssignmentService.assignToBestAgent]
    B --> C[Get Available Agents]
    C --> D{Agents Available?}
    D -->|Yes| E[Calculate Workload for Each Agent]
    D -->|No| F[Add to AssignmentQueue]
    E --> G[Select Best Agent]
    G --> H{Strategy}
    H -->|WORKLOAD_BASED| I[Select Agent with Lowest Workload]
    H -->|ROUND_ROBIN| J[Select Agent Round-Robin]
    H -->|SKILL_BASED| K[Select Agent by Skill]
    H -->|ADVANCED| L[Calculate Advanced Score]
    I --> M[Assign to Agent]
    J --> M
    K --> M
    L --> M
    M --> N[Update user.assignedTo]
    N --> O[Update user.assignedAt]
    O --> P[Send Notification to Agent]
    P --> Q[Log Assignment History]
    Q --> R[Organizer Assigned]
    F --> S[Process Queue Later]
    
    style A fill:#ff6b6b
    style B fill:#4ecdc4
    style E fill:#45b7d1
    style M fill:#f7b731
    style R fill:#95e1d3
```

## 7. Database Relationships

```mermaid
erDiagram
    User ||--o{ OrganizationDepartment : "headId"
    User ||--o{ TeamMember : "userId"
    User ||--o{ DepartmentTicket : "assignedTo"
    User ||--o{ DepartmentTicket : "createdBy"
    User ||--o{ Event : "createdBy"
    User ||--o{ Event : "approvedBy"
    User ||--o| IndividualProfile : "userId"
    User ||--o| CommunityProfile : "userId"
    User ||--o| BusinessProfile : "userId"
    User ||--o| InstitutionProfile : "userId"
    
    Team ||--o{ TeamMember : "teamId"
    Team ||--o{ TeamAssignment : "teamId"
    
    DepartmentTicket ||--o| TeamAssignment : "ticketId"
    DepartmentTicket ||--o{ TicketComment : "ticketId"
    
    Event ||--o{ EventRegistration : "eventId"
    Event ||--o{ TicketType : "eventId"
    Event ||--o{ OrganizerRevenue : "eventId"
    
    User {
        string id PK
        string role
        string department
        string organizerType
        string verificationStatus
        string assignedTo FK
    }
    
    OrganizationDepartment {
        string id PK
        string name
        string headId FK
    }
    
    Team {
        string id PK
        string name
        string teamType
        string[] categories
    }
    
    TeamMember {
        string id PK
        string teamId FK
        string userId FK
        string role
    }
    
    DepartmentTicket {
        string id PK
        string department
        string category
        string assignedTo FK
        string createdBy FK
    }
    
    TeamAssignment {
        string id PK
        string ticketId FK
        string teamId FK
        string assignedBy FK
        boolean isAutoAssigned
    }
    
    Event {
        string id PK
        string createdBy FK
        string approvedBy FK
        string assignedTo FK
        string status
    }
    
    IndividualProfile {
        string id PK
        string userId FK
        string nik
        string personalAddress
    }
    
    BusinessProfile {
        string id PK
        string userId FK
        string businessName
        string npwp
    }
```

## 8. Complete System Flow

```mermaid
graph TB
    subgraph "User Management"
        A[PARTICIPANT] --> B[Upgrade Request]
        B --> C[ORGANIZER PENDING]
    end
    
    subgraph "Assignment System"
        C --> D[SmartAssignmentService]
        D --> E[Select Best Agent]
        E --> F[Assign to OPS_AGENT]
    end
    
    subgraph "Verification Process"
        F --> G[Agent Reviews]
        G --> H{Decision}
        H -->|Approve| I[ORGANIZER APPROVED]
        H -->|Reject| J[ORGANIZER REJECTED]
    end
    
    subgraph "Event Management"
        I --> K[Create Event]
        K --> L[Event DRAFT]
        L --> M[Event PUBLISHED]
    end
    
    subgraph "Ticket System"
        N[Contact Form] --> O[DepartmentTicket]
        O --> P[Find Team by Category]
        P --> Q[Assign to Team Member]
    end
    
    subgraph "Team Management"
        R[Team Configuration] --> S[Team Members]
        S --> T[Team Assignments]
        T --> Q
    end
    
    style A fill:#ff6b6b
    style C fill:#f7b731
    style I fill:#95e1d3
    style J fill:#ff6b6b
    style M fill:#4ecdc4
    style Q fill:#45b7d1
```

## 9. Agent Workload Management

```mermaid
graph LR
    A[Agent] --> B[Get Workload]
    B --> C[Count Pending Organizers]
    B --> D[Count Draft Events]
    C --> E[Calculate Total Workload]
    D --> E
    E --> F{Workload < MAX_CAPACITY?}
    F -->|Yes| G[Available for Assignment]
    F -->|No| H[At Capacity]
    G --> I[Can Accept New Assignments]
    H --> J[Add to Queue]
    
    style A fill:#ff6b6b
    style E fill:#f7b731
    style G fill:#95e1d3
    style H fill:#ff6b6b
```

## 10. Organizer Profile Types

```mermaid
graph TD
    A[Organizer] --> B{Organizer Type}
    B -->|INDIVIDUAL| C[IndividualProfile]
    B -->|COMMUNITY| D[CommunityProfile]
    B -->|SMALL_BUSINESS| E[BusinessProfile]
    B -->|INSTITUTION| F[InstitutionProfile]
    
    C --> C1[NIK]
    C --> C2[Personal Address]
    C --> C3[Personal Phone]
    C --> C4[Portfolio]
    
    D --> D1[Community Name]
    D --> D2[Community Type]
    D --> D3[Contact Person]
    D --> D4[Legal Document]
    
    E --> E1[Business Name]
    E --> E2[Business Type]
    E --> E3[NPWP]
    E --> E4[Legal Document]
    E --> E5[Logo]
    
    F --> F1[Institution Name]
    F --> F2[Institution Type]
    F --> F3[AKTA]
    F --> F4[SIUP]
    F --> F5[Contact Person]
    
    style A fill:#ff6b6b
    style C fill:#4ecdc4
    style D fill:#45b7d1
    style E fill:#f7b731
    style F fill:#95e1d3
```

