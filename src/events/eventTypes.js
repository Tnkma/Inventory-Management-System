export const EVENTS = {

    // =========================
    // AUTH
    // =========================

    USER_REGISTERED:
        "user.registered",

    USER_LOGGED_IN:
        "user.logged_in",

    USER_LOGGED_OUT:
        "user.logged_out",

    USER_PASSWORD_CHANGED:
        "user.password_changed",


    // =========================
    // SUPPLIERS
    // =========================

    SUPPLIER_CREATED:
        "supplier.created",

    SUPPLIER_UPDATED:
        "supplier.updated",

    SUPPLIER_DEACTIVATED:
        "supplier.deactivated",


    // =========================
    // INGREDIENTS
    // =========================

    INGREDIENT_CREATED:
        "ingredient.created",

    INGREDIENT_UPDATED:
        "ingredient.updated",

    INGREDIENT_DEACTIVATED:
        "ingredient.deactivated",


    // =========================
    // PURCHASES
    // =========================

    PURCHASE_CREATED:
        "purchase.created",

    PURCHASE_COMPLETED:
        "purchase.completed",

    PURCHASE_CANCELLED:
        "purchase.cancelled",


    // =========================
    // INVENTORY
    // =========================

    STOCK_UPDATED:
        "inventory.stock_updated",

    STOCK_LOW:
        "inventory.stock_low",

    STOCK_WASTED:
        "inventory.stock_wasted",

    STOCK_ADJUSTED:
        "inventory.stock_adjusted",

    NOTIFICATION_CREATED: 
        "NOTIFICATION_CREATED",
};