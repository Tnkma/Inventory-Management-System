import {
  getOverviewReport
} from "./service.js";

import {
  validateReportFilters
} from "./validation.js";


const overviewReport = async (
  req,
  res,
  next
) => {

  try {

    const {
      startDate,
      endDate,
      locationId,
      ingredientId
    } = req.query;


    validateReportFilters({
      startDate,
      endDate,
      locationId,
      ingredientId
    });


    const report =
      await getOverviewReport({
        startDate,
        endDate,
        locationId,
        ingredientId
      });


    return res.status(200).json({

      success: true,

      data: report

    });


  } catch (error) {

    next(error);

  }

};


export {
  overviewReport
};