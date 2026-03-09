# SmartCart Admin Analytics - Data Flow Diagrams

These diagrams map the entities, processes, and tables for the finished project based on `models.py`. 
*Note: If your viewer doesn't support Mermaid, you can copy the code blocks into a viewer like [Mermaid Live](https://mermaid.live)*.

## 1. Level-0 Context Diagram
This diagram shows the main entities (Admin, Customer, and Staff) interacting with the core SmartCart system.

```mermaid
graph TD
    ADMIN[Admin]
    CUSTOMER[Customer]
    STAFF[Staff]
    
    SYSTEM((SMARTCART<br/>ROOT SYSTEM))
    
    ADMIN -- "Login / Manage System" ---> SYSTEM
    SYSTEM -- "Analytics / Data Access" ---> ADMIN
    
    CUSTOMER -- "Login / Browse / Buy" ---> SYSTEM
    SYSTEM -- "Order Status / Notifications" ---> CUSTOMER
    
    STAFF -- "Login / Add POS Sales" ---> SYSTEM
    SYSTEM -- "Dashboard Access" ---> STAFF
    
    %% Styling to match the example vibe
    style SYSTEM fill:#fff,stroke:#333,stroke-width:2px,color:#000
    style ADMIN fill:#f9f9f9,stroke:#333,stroke-width:1px,color:#000
    style CUSTOMER fill:#f9f9f9,stroke:#333,stroke-width:1px,color:#000
    style STAFF fill:#f9f9f9,stroke:#333,stroke-width:1px,color:#000
```

## 2. Level-1 DFD: Admin (System Administrator)
This maps exactly what the Admin can do and which database tables those actions talk to.

```mermaid
graph LR
    ADMIN[Admin]
    
    %% Processes
    P1((1.0 Login /<br/>Manage Users))
    P2((2.0 Manage<br/>Catalog))
    P3((3.0 View<br/>Analytics))
    P4((4.0 Manage<br/>Refunds & Tickets))
    
    %% Data Stores
    T1[USER_Table]
    T2[PRODUCT_Table<br/>CATEGORY_Table]
    T3[ORDER_Table<br/>OFFLINE_SALES_Table]
    T4[REFUND_Table<br/>SUPPORT_TICKET_Table]
    
    %% Connections
    ADMIN -- "Admin Auth / Details" ---> P1
    P1 -- "Verify / Modify" ---> T1
    T1 -- "User Data" ---> P1
    
    ADMIN -- "Add / Edit Items" ---> P2
    P2 -- "Modification" ---> T2
    T2 -- "Product State" ---> P2
    
    ADMIN -- "Request Reports" ---> P3
    P3 -- "Sales Data" ---> T3
    T3 -- "Aggregated Metrics" ---> P3
    
    ADMIN -- "Process Requests" ---> P4
    P4 -- "Status Update" ---> T4
    T4 -- "Ticket/Refund Details" ---> P4

    %% Styling
    style ADMIN fill:#f9f9f9,stroke:#333,stroke-width:1.5px,color:#000
    style P1 fill:#fff,stroke:#333,color:#000
    style P2 fill:#fff,stroke:#333,color:#000
    style P3 fill:#fff,stroke:#333,color:#000
    style P4 fill:#fff,stroke:#333,color:#000
    style T1 fill:#e6f3ff,stroke:#333,color:#000
    style T2 fill:#e6f3ff,stroke:#333,color:#000
    style T3 fill:#e6f3ff,stroke:#333,color:#000
    style T4 fill:#e6f3ff,stroke:#333,color:#000
```

## 3. Level-1 DFD: Customer (Shopper)
This maps the standard user journey on the frontend and the tables involved.

```mermaid
graph LR
    CUST[Customer]
    
    %% Processes
    P1((1.0 Login /<br/>Register))
    P2((2.0 Browse &<br/>Search))
    P3((3.0 Place<br/>Orders))
    P4((4.0 Add to<br/>Wishlist))
    P5((5.0 Post<br/>Reviews))
    
    %% Data Stores
    T1[USER_Table<br/>ADDRESS_Table]
    T2[PRODUCT_Table<br/>PRODUCT_IMAGE_Table]
    T3[ORDER_Table<br/>ORDER_ITEM_Table]
    T4[WISHLIST_Table]
    T5[REVIEW_Table]
    
    %% Connections
    CUST -- "Credentials / Info" ---> P1
    P1 -- "Auth Token" ---> T1
    T1 -- "Profile" ---> P1
    
    CUST -- "Search Queries" ---> P2
    P2 -- "View" ---> T2
    
    CUST -- "Checkout Payment" ---> P3
    P3 -- "Create Record" ---> T3
    T3 -- "Receipt/Status" ---> P3
    
    CUST -- "Save for Later" ---> P4
    P4 -- "Add item_id" ---> T4
    T4 -- "View Wishlist" ---> P4
    
    CUST -- "Ratings/Text" ---> P5
    P5 -- "Modification" ---> T5
    T5 -- "Display Status" ---> P5

    %% Styling
    style CUST fill:#f9f9f9,stroke:#333,stroke-width:1.5px,color:#000
    style P1 fill:#fff,stroke:#333,color:#000
    style P2 fill:#fff,stroke:#333,color:#000
    style P3 fill:#fff,stroke:#333,color:#000
    style P4 fill:#fff,stroke:#333,color:#000
    style P5 fill:#fff,stroke:#333,color:#000
    style T1 fill:#e6f3ff,stroke:#333,color:#000
    style T2 fill:#e6f3ff,stroke:#333,color:#000
    style T3 fill:#e6f3ff,stroke:#333,color:#000
    style T4 fill:#e6f3ff,stroke:#333,color:#000
    style T5 fill:#e6f3ff,stroke:#333,color:#000
```

## 4. Level-1 DFD: Staff (In-Store Agent/Support)
This covers the offline sales entry and replying to support queries.

```mermaid
graph LR
    STAFF[Staff Member]
    
    %% Processes
    P1((1.0 Login /<br/>Auth))
    P2((2.0 Record<br/>Offline Sales))
    P3((3.0 Handle<br/>Support Tickets))
    
    %% Data Stores
    T1[USER_Table]
    T2[OFFLINE_SALES_Table]
    T3[SUPPORT_TICKET_Table<br/>TICKET_MESSAGE_Table]
    
    %% Connections
    STAFF -- "Staff Credentials" ---> P1
    P1 -- "Verify Role" ---> T1
    T1 -- "Access Granted" ---> P1
    
    STAFF -- "Daily Revenue Input" ---> P2
    P2 -- "Modification" ---> T2
    T2 -- "Verification" ---> P2
    
    STAFF -- "Chat Messages" ---> P3
    P3 -- "Reply / Close Segment" ---> T3
    T3 -- "Customer Thread" ---> P3

    %% Styling
    style STAFF fill:#f9f9f9,stroke:#333,stroke-width:1.5px,color:#000
    style P1 fill:#fff,stroke:#333,color:#000
    style P2 fill:#fff,stroke:#333,color:#000
    style P3 fill:#fff,stroke:#333,color:#000
    style T1 fill:#e6f3ff,stroke:#333,color:#000
    style T2 fill:#e6f3ff,stroke:#333,color:#000
    style T3 fill:#e6f3ff,stroke:#333,color:#000
```
