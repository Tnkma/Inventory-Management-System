CREATE DATABASE IF NOT EXISTS restaurant_inventory
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE restaurant_inventory;


-- =========================================================
-- 1. ROLES
-- =========================================================

CREATE TABLE roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(50) NOT NULL UNIQUE,

    description VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- =========================================================
-- 2. INVENTORY LOCATIONS
-- =========================================================
-- Locations are created before users because users can now
-- be assigned to a particular kitchen.
-- =========================================================

CREATE TABLE inventory_locations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,

    description VARCHAR(255),

    location_type ENUM(
        'MAIN_STORE',
        'KITCHEN'
    ) NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_inventory_locations_type (
        location_type
    ),

    INDEX idx_inventory_locations_active (
        is_active
    )
);


-- =========================================================
-- 3. USERS
-- =========================================================

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    role_id INT UNSIGNED NOT NULL,

    -- Kitchen staff can be assigned to a specific kitchen.
    -- Admin / Manager / Store Keeper may remain NULL.
    assigned_location_id INT UNSIGNED NULL,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    phone VARCHAR(30),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    last_login_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,


    CONSTRAINT fk_users_assigned_location
        FOREIGN KEY (assigned_location_id)
        REFERENCES inventory_locations(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,


    INDEX idx_users_role (role_id),

    INDEX idx_users_assigned_location (
        assigned_location_id
    ),

    INDEX idx_users_active (is_active)
);


-- =========================================================
-- 4. CATEGORIES
-- =========================================================

CREATE TABLE inventory_categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,

    description VARCHAR(255),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- =========================================================
-- 5. SUPPLIERS
-- =========================================================

CREATE TABLE suppliers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    contact_person VARCHAR(150),

    email VARCHAR(150),

    phone VARCHAR(30),

    address TEXT,

    city VARCHAR(100),

    notes TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by INT UNSIGNED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    CONSTRAINT fk_supplier_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,


    INDEX idx_suppliers_created_by (
        created_by
    ),

    INDEX idx_suppliers_active (
        is_active
    )
);


-- =========================================================
-- 6. INGREDIENTS
-- =========================================================

CREATE TABLE ingredients (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    category_id INT UNSIGNED NOT NULL,

    name VARCHAR(150) NOT NULL,

    sku VARCHAR(50) UNIQUE,

    description TEXT,

    unit VARCHAR(30) NOT NULL,

    minimum_stock DECIMAL(12,3) NOT NULL DEFAULT 0,

    maximum_stock DECIMAL(12,3),

    reorder_level DECIMAL(12,3) NOT NULL DEFAULT 0,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by INT UNSIGNED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    CONSTRAINT fk_ingredient_category
        FOREIGN KEY (category_id)
        REFERENCES inventory_categories(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,


    CONSTRAINT fk_ingredient_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,


    INDEX idx_ingredients_category (
        category_id
    ),

    INDEX idx_ingredients_created_by (
        created_by
    ),

    INDEX idx_ingredients_active (
        is_active
    )
);


-- =========================================================
-- 7. INVENTORY
-- =========================================================

CREATE TABLE inventory (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    ingredient_id INT UNSIGNED NOT NULL,

    location_id INT UNSIGNED NOT NULL,

    current_quantity DECIMAL(12,3) NOT NULL DEFAULT 0,

    reserved_quantity DECIMAL(12,3) NOT NULL DEFAULT 0,

    last_stock_update TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    CONSTRAINT fk_inventory_ingredient
        FOREIGN KEY (ingredient_id)
        REFERENCES ingredients(id)
        ON DELETE CASCADE,


    CONSTRAINT fk_inventory_location
        FOREIGN KEY (location_id)
        REFERENCES inventory_locations(id)
        ON DELETE RESTRICT,


    CONSTRAINT chk_inventory_reserved
        CHECK (
            reserved_quantity >= 0
            AND reserved_quantity <= current_quantity
        ),


    UNIQUE KEY unique_ingredient_location (
        ingredient_id,
        location_id
    ),


    INDEX idx_inventory_location (
        location_id
    ),

    INDEX idx_inventory_ingredient (
        ingredient_id
    )
);


-- =========================================================
-- 8. PURCHASES
-- =========================================================

CREATE TABLE purchases (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    supplier_id INT UNSIGNED NOT NULL,

    -- User who submitted the purchase / stock receipt
    user_id INT UNSIGNED NOT NULL,

    -- User who approved the purchase
    approved_by INT UNSIGNED NULL,

    purchase_date DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    approved_at DATETIME NULL,

    status ENUM(
        'PENDING',
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PENDING',

    total_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    CONSTRAINT fk_purchases_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES suppliers(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,


    CONSTRAINT fk_purchases_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,


    CONSTRAINT fk_purchases_approved_by
        FOREIGN KEY (approved_by)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,


    INDEX idx_purchases_supplier (
        supplier_id
    ),

    INDEX idx_purchases_user (
        user_id
    ),

    INDEX idx_purchases_approved_by (
        approved_by
    ),

    INDEX idx_purchases_date (
        purchase_date
    ),

    INDEX idx_purchases_status (
        status
    ),

    INDEX idx_purchases_approved_at (
        approved_at
    )
);


-- =========================================================
-- 9. PURCHASE ITEMS
-- =========================================================

CREATE TABLE purchase_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    purchase_id INT UNSIGNED NOT NULL,

    ingredient_id INT UNSIGNED NOT NULL,

    quantity DECIMAL(12,3) NOT NULL,

    unit_price DECIMAL(12,2) NOT NULL,

    total_price DECIMAL(14,2)
        GENERATED ALWAYS AS (
            quantity * unit_price
        ) STORED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_purchase_items_purchase
        FOREIGN KEY (purchase_id)
        REFERENCES purchases(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,


    CONSTRAINT fk_purchase_items_ingredient
        FOREIGN KEY (ingredient_id)
        REFERENCES ingredients(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,


    INDEX idx_purchase_items_purchase (
        purchase_id
    ),

    INDEX idx_purchase_items_ingredient (
        ingredient_id
    )
);


-- =========================================================
-- 10. STOCK TRANSFERS
-- =========================================================
--
-- A stock transfer is now a WORKFLOW:
--
-- REQUESTED
--     ↓
-- APPROVED
--     ↓
-- FULFILLED
--
-- OR
--
-- REQUESTED
--     ↓
-- REJECTED
--
-- IMPORTANT:
--
-- APPROVED does NOT move physical stock.
--
-- APPROVED reserves stock at the source location.
--
-- FULFILLED actually moves the stock.
-- =========================================================

CREATE TABLE stock_transfers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,


    -- =====================================================
    -- STOCK INFORMATION
    -- =====================================================

    ingredient_id INT UNSIGNED NOT NULL,

    from_location_id INT UNSIGNED NOT NULL,

    to_location_id INT UNSIGNED NOT NULL,

    quantity DECIMAL(12,3) NOT NULL,


    -- =====================================================
    -- REQUEST INFORMATION
    -- =====================================================

    reason TEXT,

    requested_by INT UNSIGNED NOT NULL,

    requested_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,


    -- =====================================================
    -- WORKFLOW STATUS
    -- =====================================================

    status ENUM(
        'REQUESTED',
        'APPROVED',
        'REJECTED',
        'FULFILLED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'REQUESTED',


    -- =====================================================
    -- APPROVAL
    -- =====================================================

    approved_by INT UNSIGNED NULL,

    approved_at DATETIME NULL,


    -- =====================================================
    -- REJECTION
    -- =====================================================

    rejected_by INT UNSIGNED NULL,

    rejected_at DATETIME NULL,

    rejection_reason TEXT NULL,


    -- =====================================================
    -- FULFILLMENT
    -- =====================================================

    fulfilled_by INT UNSIGNED NULL,

    fulfilled_at DATETIME NULL,


    -- =====================================================
    -- RECORD CREATION
    -- =====================================================

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    -- =====================================================
    -- FOREIGN KEYS
    -- =====================================================

    CONSTRAINT fk_transfer_ingredient
        FOREIGN KEY (ingredient_id)
        REFERENCES ingredients(id)
        ON DELETE RESTRICT,


    CONSTRAINT fk_transfer_from_location
        FOREIGN KEY (from_location_id)
        REFERENCES inventory_locations(id)
        ON DELETE RESTRICT,


    CONSTRAINT fk_transfer_to_location
        FOREIGN KEY (to_location_id)
        REFERENCES inventory_locations(id)
        ON DELETE RESTRICT,


    CONSTRAINT fk_transfer_requested_by
        FOREIGN KEY (requested_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,


    CONSTRAINT fk_transfer_approved_by
        FOREIGN KEY (approved_by)
        REFERENCES users(id)
        ON DELETE SET NULL,


    CONSTRAINT fk_transfer_rejected_by
        FOREIGN KEY (rejected_by)
        REFERENCES users(id)
        ON DELETE SET NULL,


    CONSTRAINT fk_transfer_fulfilled_by
        FOREIGN KEY (fulfilled_by)
        REFERENCES users(id)
        ON DELETE SET NULL,


    -- =====================================================
    -- VALIDATION
    -- =====================================================

    CONSTRAINT chk_transfer_quantity
        CHECK (quantity > 0),


    CONSTRAINT chk_transfer_different_locations
        CHECK (
            from_location_id <> to_location_id
        ),


    -- =====================================================
    -- INDEXES
    -- =====================================================

    INDEX idx_transfer_ingredient (
        ingredient_id
    ),

    INDEX idx_transfer_from_location (
        from_location_id
    ),

    INDEX idx_transfer_to_location (
        to_location_id
    ),

    INDEX idx_transfer_requested_by (
        requested_by
    ),

    INDEX idx_transfer_approved_by (
        approved_by
    ),

    INDEX idx_transfer_rejected_by (
        rejected_by
    ),

    INDEX idx_transfer_fulfilled_by (
        fulfilled_by
    ),

    INDEX idx_transfer_status (
        status
    ),

    INDEX idx_transfer_requested_at (
        requested_at
    ),

    INDEX idx_transfer_created_at (
        created_at
    )
);


-- =========================================================
-- 11. STOCK MOVEMENTS
-- =========================================================

CREATE TABLE stock_movements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    ingredient_id INT UNSIGNED NOT NULL,

    location_id INT UNSIGNED NOT NULL,

    movement_type ENUM(
        'PURCHASE',
        'CONSUMPTION',
        'WASTAGE',
        'ADJUSTMENT',
        'RETURN',
        'TRANSFER'
    ) NOT NULL,

    quantity DECIMAL(12,3) NOT NULL,

    previous_quantity DECIMAL(12,3) NOT NULL,

    new_quantity DECIMAL(12,3) NOT NULL,

    reference_type VARCHAR(50),

    reference_id INT UNSIGNED,

    reason TEXT,

    created_by INT UNSIGNED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_movement_ingredient
        FOREIGN KEY (ingredient_id)
        REFERENCES ingredients(id)
        ON DELETE RESTRICT,


    CONSTRAINT fk_movement_location
        FOREIGN KEY (location_id)
        REFERENCES inventory_locations(id)
        ON DELETE RESTRICT,


    CONSTRAINT fk_movement_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,


    INDEX idx_movement_ingredient (
        ingredient_id
    ),

    INDEX idx_movement_location (
        location_id
    ),

    INDEX idx_movement_type (
        movement_type
    ),

    INDEX idx_movement_reference (
        reference_type,
        reference_id
    ),

    INDEX idx_movement_created_by (
        created_by
    ),

    INDEX idx_movement_created_at (
        created_at
    )
);


-- =========================================================
-- 12. NOTIFICATIONS
-- =========================================================

CREATE TABLE notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    type VARCHAR(50) NOT NULL,

    title VARCHAR(150) NOT NULL,

    message TEXT NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    read_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,


    INDEX idx_notifications_user (
        user_id
    ),

    INDEX idx_notifications_read (
        is_read
    ),

    INDEX idx_notifications_created (
        created_at
    )
);


-- =========================================================
-- 13. AUDIT LOGS
-- =========================================================

CREATE TABLE audit_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NULL,

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100),

    entity_id INT UNSIGNED NULL,

    description TEXT,

    metadata JSON NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,


    INDEX idx_audit_logs_user (
        user_id
    ),

    INDEX idx_audit_logs_action (
        action
    ),

    INDEX idx_audit_logs_entity (
        entity_type,
        entity_id
    ),

    INDEX idx_audit_logs_created (
        created_at
    )
);

