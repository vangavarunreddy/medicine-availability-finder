import * as vendorService from '../services/vendorService.js';

export const getVendors = async (req, res, next) => {
  try {
    const { status, vendor_type, search } = req.query;
    const vendors = await vendorService.getAdminVendorList({ status, vendor_type, search });
    res.status(200).json({
      success: true,
      data: { vendors, count: vendors.length }
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingVendors = async (req, res, next) => {
  try {
    const vendors = await vendorService.getAdminVendorList({ status: 'PENDING' });
    res.status(200).json({
      success: true,
      data: { vendors, count: vendors.length }
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorStats = async (req, res, next) => {
  try {
    const stats = await vendorService.getAdminVendorStats();
    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendors = await vendorService.getAdminVendorList({ search: id });
    if (vendors.length === 0) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }
    res.status(200).json({
      success: true,
      data: { vendor: vendors[0] }
    });
  } catch (error) {
    next(error);
  }
};

export const approveVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedVendor = await vendorService.updateVendorApprovalStatus(id, 'APPROVED');
    res.status(200).json({
      success: true,
      message: `Vendor "${updatedVendor.business_name}" approved successfully. Notification email dispatched.`,
      data: { vendor: updatedVendor }
    });
  } catch (error) {
    next(error);
  }
};

export const rejectVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const updatedVendor = await vendorService.updateVendorApprovalStatus(id, 'REJECTED', reason);
    res.status(200).json({
      success: true,
      message: `Vendor "${updatedVendor.business_name}" registration rejected. Notification email dispatched.`,
      data: { vendor: updatedVendor }
    });
  } catch (error) {
    next(error);
  }
};
