import * as inventoryService from '../services/inventoryService.js';

export const getInventory = async (req, res, next) => {
  try {
    const vendorId = req.user.vendor_id;
    if (!vendorId) {
      return res.status(403).json({ success: false, message: 'Vendor profile not associated with this account.' });
    }
    const { search, statusFilter, formFilter } = req.query;
    const inventory = await inventoryService.getVendorInventory(vendorId, { search, statusFilter, formFilter });
    res.status(200).json({
      success: true,
      data: { inventory, count: inventory.length }
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryStats = async (req, res, next) => {
  try {
    const vendorId = req.user.vendor_id;
    if (!vendorId) {
      return res.status(403).json({ success: false, message: 'Vendor profile not associated with this account.' });
    }
    const stats = await inventoryService.getVendorInventoryStats(vendorId);
    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

export const addInventoryItem = async (req, res, next) => {
  try {
    const vendorId = req.user.vendor_id;
    if (!vendorId) {
      return res.status(403).json({ success: false, message: 'Vendor profile not associated with this account.' });
    }
    const item = await inventoryService.addInventoryItem(vendorId, req.body);
    res.status(201).json({
      success: true,
      message: 'Medicine added to inventory successfully.',
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

export const updateInventoryItem = async (req, res, next) => {
  try {
    const vendorId = req.user.vendor_id;
    const { id } = req.params;
    if (!vendorId) {
      return res.status(403).json({ success: false, message: 'Vendor profile not associated with this account.' });
    }
    const item = await inventoryService.updateInventoryItem(vendorId, id, req.body);
    res.status(200).json({
      success: true,
      message: 'Stock details updated.',
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteInventoryItem = async (req, res, next) => {
  try {
    const vendorId = req.user.vendor_id;
    const { id } = req.params;
    if (!vendorId) {
      return res.status(403).json({ success: false, message: 'Vendor profile not associated with this account.' });
    }
    await inventoryService.deleteInventoryItem(vendorId, id);
    res.status(200).json({
      success: true,
      message: 'Inventory line removed.'
    });
  } catch (error) {
    next(error);
  }
};
