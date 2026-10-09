import * as medicineService from '../services/medicineService.js';

export const getMedicines = async (req, res, next) => {
  try {
    const { search, form, limit, offset } = req.query;
    const medicines = await medicineService.getCatalogMedicines({ search, form, limit, offset });
    res.status(200).json({
      success: true,
      data: { medicines, count: medicines.length }
    });
  } catch (error) {
    next(error);
  }
};

export const getMedicine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await medicineService.getMedicineById(id);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const createMedicine = async (req, res, next) => {
  try {
    const medicine = await medicineService.createMedicine(req.body);
    res.status(201).json({
      success: true,
      message: 'Medicine added to catalog successfully.',
      data: { medicine }
    });
  } catch (error) {
    next(error);
  }
};

export const updateMedicine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const medicine = await medicineService.updateMedicine(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Medicine catalog specification updated.',
      data: { medicine }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMedicine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await medicineService.deactivateMedicine(id);
    res.status(200).json({
      success: true,
      message: 'Medicine deactivated in catalog.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
