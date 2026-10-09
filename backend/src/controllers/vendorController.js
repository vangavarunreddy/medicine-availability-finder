import * as vendorService from '../services/vendorService.js';

export const getVendorMe = async (req, res, next) => {
  try {
    const vendor = await vendorService.getVendorByUserId(req.user.id);
    res.status(200).json({
      success: true,
      data: { vendor }
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendor = await vendorService.getPublicVendorById(id);
    res.status(200).json({
      success: true,
      data: { vendor }
    });
  } catch (error) {
    next(error);
  }
};
