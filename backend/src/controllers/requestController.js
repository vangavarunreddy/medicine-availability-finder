import * as requestService from '../services/requestService.js';

export const createRequest = async (req, res, next) => {
  try {
    const result = await requestService.createMedicineRequest(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Medicine reservation request submitted successfully. The vendor has been notified.',
      data: { request: result }
    });
  } catch (error) {
    next(error);
  }
};

export const getRequests = async (req, res, next) => {
  try {
    const requests = await requestService.getUserOrVendorRequests(req.user);
    res.status(200).json({
      success: true,
      data: { requests, count: requests.length }
    });
  } catch (error) {
    next(error);
  }
};

export const updateRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const vendorId = req.user.vendor_id;
    if (!vendorId) {
      return res.status(403).json({ success: false, message: 'Only vendors can update request status.' });
    }
    const updated = await requestService.updateRequestStatus(vendorId, id, status);
    res.status(200).json({
      success: true,
      message: `Reservation request status updated to ${status}. Patient notified.`,
      data: { request: updated }
    });
  } catch (error) {
    next(error);
  }
};
