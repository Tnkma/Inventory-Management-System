USE restaurant_inventory;

-- =========================================================
-- ROLES
-- =========================================================

INSERT INTO roles (name, description)
VALUES
    ('ADMIN', 'Full system access'),
    ('MANAGER', 'Manages restaurant operations and inventory'),
    ('STORE_KEEPER', 'Manages stock and purchases'),
    ('KITCHEN_STAFF', 'Requests and consumes ingredients');


-- =========================================================
-- CATEGORIES
-- =========================================================

INSERT INTO inventory_categories (name, description)
VALUES
    ('Grains', 'Rice, wheat, oats and other grains'),
    ('Meat', 'Beef, chicken, pork and other meat'),
    ('Vegetables', 'Fresh vegetables'),
    ('Dairy', 'Milk, cheese, butter and other dairy products'),
    ('Seafood', 'Fish, shrimp and other seafood'),
    ('Spices', 'Pepper, salt, seasoning and spices'),
    ('Oil', 'Cooking oils and fats'),
    ('Beverages', 'Drinks and beverage ingredients'),
    ('Frozen Foods', 'Frozen ingredients and products'),
    ('Fruits', 'Fresh fruits'),
    ('Cooking Oils', 'Cooking oils and fats'),
    ('Packaging', 'Takeaway and food packaging'),
    ('Cleaning Supplies', 'Restaurant cleaning materials');