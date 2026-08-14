import pool
  from "../../config/database.js";


// =========================================================
// BUILD FILTERS
// =========================================================

const buildMovementFilters = ({
  startDate,
  endDate,
  locationId,
  ingredientId
}) => {

  const conditions = [];

  const values = [];


  if (startDate) {

    conditions.push(
      "sm.created_at >= ?"
    );

    values.push(
      `${startDate} 00:00:00`
    );

  }


  if (endDate) {

    conditions.push(
      "sm.created_at <= ?"
    );

    values.push(
      `${endDate} 23:59:59`
    );

  }


  if (locationId) {

    conditions.push(
      "sm.location_id = ?"
    );

    values.push(
      Number(locationId)
    );

  }


  if (ingredientId) {

    conditions.push(
      "sm.ingredient_id = ?"
    );

    values.push(
      Number(ingredientId)
    );

  }


  return {
    sql:
      conditions.length > 0
        ? `AND ${conditions.join(" AND ")}`
        : "",

    values
  };

};


// =========================================================
// OVERVIEW REPORT
// =========================================================

const getOverviewReport = async ({
  startDate,
  endDate,
  locationId,
  ingredientId
}) => {

  const {
    sql,
    values
  } =
    buildMovementFilters({
      startDate,
      endDate,
      locationId,
      ingredientId
    });


  // -------------------------------------------------------
  // MOVEMENT SUMMARY
  // -------------------------------------------------------

  const [summaryRows] =
    await pool.query(
      `
        SELECT

          COALESCE(
            SUM(
              CASE
                WHEN sm.movement_type = 'PURCHASE'
                THEN ABS(sm.quantity)
                ELSE 0
              END
            ),
            0
          ) AS purchases_quantity,


          COALESCE(
            SUM(
              CASE
                WHEN sm.movement_type = 'CONSUMPTION'
                THEN ABS(sm.quantity)
                ELSE 0
              END
            ),
            0
          ) AS consumption_quantity,


          COALESCE(
            SUM(
              CASE
                WHEN sm.movement_type = 'WASTAGE'
                THEN ABS(sm.quantity)
                ELSE 0
              END
            ),
            0
          ) AS wastage_quantity,


          COUNT(
            CASE
              WHEN sm.movement_type = 'PURCHASE'
              THEN 1
            END
          ) AS purchase_movements,


          COUNT(
            CASE
              WHEN sm.movement_type = 'CONSUMPTION'
              THEN 1
            END
          ) AS consumption_movements,


          COUNT(
            CASE
              WHEN sm.movement_type = 'WASTAGE'
              THEN 1
            END
          ) AS wastage_movements,


          COUNT(
            CASE
              WHEN sm.movement_type = 'TRANSFER'
              THEN 1
            END
          ) AS transfer_movements

        FROM stock_movements sm

        WHERE 1 = 1

        ${sql}
      `,
      values
    );


  // -------------------------------------------------------
  // CURRENT INVENTORY
  // -------------------------------------------------------

  const inventoryConditions = [];

  const inventoryValues = [];


  if (locationId) {

    inventoryConditions.push(
      "inv.location_id = ?"
    );

    inventoryValues.push(
      Number(locationId)
    );

  }


  if (ingredientId) {

    inventoryConditions.push(
      "inv.ingredient_id = ?"
    );

    inventoryValues.push(
      Number(ingredientId)
    );

  }


  const inventoryFilter =
    inventoryConditions.length > 0
      ? `AND ${inventoryConditions.join(" AND ")}`
      : "";


  const [inventoryRows] =
    await pool.query(
      `
        SELECT

          COALESCE(
            SUM(inv.current_quantity),
            0
          ) AS current_quantity,


          COALESCE(
            SUM(inv.reserved_quantity),
            0
          ) AS reserved_quantity

        FROM inventory inv

        INNER JOIN inventory_locations il
          ON inv.location_id = il.id

        INNER JOIN ingredients i
          ON inv.ingredient_id = i.id

        WHERE il.is_active = TRUE
          AND i.is_active = TRUE

        ${inventoryFilter}
      `,
      inventoryValues
    );


  // -------------------------------------------------------
  // TOP CONSUMED INGREDIENTS
  // -------------------------------------------------------

  const [topConsumption] =
    await pool.query(
      `
        SELECT

          sm.ingredient_id,

          i.name AS ingredient,

          i.unit,

          SUM(
            ABS(sm.quantity)
          ) AS quantity

        FROM stock_movements sm

        INNER JOIN ingredients i
          ON sm.ingredient_id = i.id

        WHERE sm.movement_type = 'CONSUMPTION'

        ${sql}

        GROUP BY
          sm.ingredient_id,
          i.name,
          i.unit

        ORDER BY quantity DESC

        LIMIT 10
      `,
      values
    );


  // -------------------------------------------------------
  // TOP WASTAGE
  // -------------------------------------------------------

  const [topWastage] =
    await pool.query(
      `
        SELECT

          sm.ingredient_id,

          i.name AS ingredient,

          i.unit,

          SUM(
            ABS(sm.quantity)
          ) AS quantity

        FROM stock_movements sm

        INNER JOIN ingredients i
          ON sm.ingredient_id = i.id

        WHERE sm.movement_type = 'WASTAGE'

        ${sql}

        GROUP BY
          sm.ingredient_id,
          i.name,
          i.unit

        ORDER BY quantity DESC

        LIMIT 10
      `,
      values
    );


  return {

    summary: summaryRows[0],

    inventory: inventoryRows[0],

    topConsumption,

    topWastage

  };

};


// =========================================================
// EXPORT
// =========================================================

export {
  getOverviewReport
};