import pool from "../../config/database.js";

import eventBus from "../../events/eventBus.js";

import { EVENTS }
  from "../../events/eventTypes.js";


const createSupplier = async ({
  name,
  contactPerson,
  email,
  phone,
  address,
  city,
  notes
}, createdBy) => {

  const [result] = await pool.query(
    `
      INSERT INTO suppliers
      (
        name,
        contact_person,
        email,
        phone,
        address,
        city,
        notes,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      name,
      contactPerson || null,
      email || null,
      phone || null,
      address || null,
      city || null,
      notes || null,
      createdBy
    ]
  );


  const supplierId = result.insertId;


  const supplier = await getSupplierById(
    supplierId
  );


  eventBus.emit(
    EVENTS.SUPPLIER_CREATED,
    {
      supplierId,
      supplierName: supplier.name,
      createdBy
    }
  );


  return supplier;
};


const getSuppliers = async () => {

  const [suppliers] = await pool.query(`
    SELECT
      s.id,
      s.name,
      s.contact_person,
      s.email,
      s.phone,
      s.address,
      s.city,
      s.notes,
      s.is_active,
      s.created_at,
      s.updated_at,

      u.first_name AS created_by_first_name,
      u.last_name AS created_by_last_name

    FROM suppliers s

    LEFT JOIN users u
      ON s.created_by = u.id

    ORDER BY s.created_at DESC
  `);


  return suppliers;
};


const getSupplierById = async (
  supplierId
) => {

  const [suppliers] = await pool.query(
    `
      SELECT
        s.id,
        s.name,
        s.contact_person,
        s.email,
        s.phone,
        s.address,
        s.city,
        s.notes,
        s.is_active,
        s.created_at,
        s.updated_at,

        u.first_name AS created_by_first_name,
        u.last_name AS created_by_last_name

      FROM suppliers s

      LEFT JOIN users u
        ON s.created_by = u.id

      WHERE s.id = ?

      LIMIT 1
    `,
    [supplierId]
  );


  if (suppliers.length === 0) {

    const error = new Error(
      "Supplier not found"
    );

    error.statusCode = 404;

    throw error;
  }


  return suppliers[0];
};


const updateSupplier = async (
  supplierId,
  {
    name,
    contactPerson,
    email,
    phone,
    address,
    city,
    notes
  },
  updatedBy
) => {

  const [result] = await pool.query(
    `
      UPDATE suppliers

      SET
        name = ?,
        contact_person = ?,
        email = ?,
        phone = ?,
        address = ?,
        city = ?,
        notes = ?

      WHERE id = ?
    `,
    [
      name,
      contactPerson || null,
      email || null,
      phone || null,
      address || null,
      city || null,
      notes || null,
      supplierId
    ]
  );


  if (result.affectedRows === 0) {

    const error = new Error(
      "Supplier not found"
    );

    error.statusCode = 404;

    throw error;
  }


  const supplier =
    await getSupplierById(supplierId);


  eventBus.emit(
    EVENTS.SUPPLIER_UPDATED,
    {
      supplierId,
      supplierName: supplier.name,
      updatedBy
    }
  );


  return supplier;
};


const updateSupplierStatus = async (
  supplierId,
  isActive,
  updatedBy
) => {

  const [result] = await pool.query(
    `
      UPDATE suppliers

      SET is_active = ?

      WHERE id = ?
    `,
    [
      isActive,
      supplierId
    ]
  );


  if (result.affectedRows === 0) {

    const error = new Error(
      "Supplier not found"
    );

    error.statusCode = 404;

    throw error;
  }


  const supplier =
    await getSupplierById(supplierId);


  eventBus.emit(
    EVENTS.SUPPLIER_STATUS_UPDATED,
    {
      supplierId,
      supplierName: supplier.name,
      isActive,
      updatedBy
    }
  );


  return supplier;
};


export {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  updateSupplierStatus
};