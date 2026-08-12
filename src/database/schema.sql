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
-- 2. USERS
-- =========================================================

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id INT UNSIGNED NOT NULL,

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
        ON DELETE RESTRICT
);


-- =========================================================
-- 3. CATEGORIES
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
-- 4. SUPPLIERS
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
        ON DELETE SET NULL
);


-- =========================================================
-- 5. INGREDIENTS
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
        ON DELETE SET NULL
);

-- =========================================================
-- 6. INVENTORY LOCATIONS
-- =========================================================

CREATE TABLE inventory_locations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,

    description VARCHAR(255),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
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

    UNIQUE KEY unique_ingredient_location (
        ingredient_id,
        location_id
    )
);

-- =========================================================
-- 12. STOCK TRANSFERS
-- =========================================================

CREATE TABLE stock_transfers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    ingredient_id INT UNSIGNED NOT NULL,

    from_location_id INT UNSIGNED NOT NULL,
    to_location_id INT UNSIGNED NOT NULL,

    quantity DECIMAL(12,3) NOT NULL,

    reason TEXT,

    created_by INT UNSIGNED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

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

    CONSTRAINT fk_transfer_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_transfer_ingredient (ingredient_id),
    INDEX idx_transfer_from_location (from_location_id),
    INDEX idx_transfer_to_location (to_location_id),
    INDEX idx_transfer_created_by (created_by),
    INDEX idx_transfer_created_at (created_at)
);

-- =========================================================
-- 7. PURCHASES
-- =========================================================

CREATE TABLE purchases (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    supplier_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,

    purchase_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status ENUM(
        'PENDING',
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PENDING',

    total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,

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

    INDEX idx_purchases_supplier (supplier_id),
    INDEX idx_purchases_user (user_id),
    INDEX idx_purchases_date (purchase_date),
    INDEX idx_purchases_status (status)
);


-- =========================================================
-- 8. PURCHASE ITEMS
-- =========================================================

CREATE TABLE purchase_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    purchase_id INT UNSIGNED NOT NULL,
    ingredient_id INT UNSIGNED NOT NULL,

    quantity DECIMAL(12, 3) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,

    total_price DECIMAL(14, 2)
        GENERATED ALWAYS AS (quantity * unit_price) STORED,

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

    INDEX idx_purchase_items_purchase (purchase_id),
    INDEX idx_purchase_items_ingredient (ingredient_id)
);


-- =========================================================
-- 9. STOCK MOVEMENTS
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
        REFERENCES ingredients(id),

    CONSTRAINT fk_movement_location
        FOREIGN KEY (location_id)
        REFERENCES inventory_locations(id),

    CONSTRAINT fk_movement_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- =========================================================
-- 10. NOTIFICATIONS
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

    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (is_read),
    INDEX idx_notifications_created (created_at)
);


-- =========================================================
-- 11. AUDIT LOGS
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

    INDEX idx_audit_logs_user (user_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_entity (entity_type, entity_id),
    INDEX idx_audit_logs_created (created_at)
);
