import { searchMedicineAvailability } from '../services/searchService.js';

export const handleSearch = async (req, res, next) => {
  try {
    const { q, location, vendor_type, availability, form, dosage, sortBy, limit, offset } = req.query;
    const results = await searchMedicineAvailability({
      q,
      location,
      vendor_type,
      availability,
      form,
      dosage,
      sortBy,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });

    res.status(200).json({
      success: true,
      data: {
        results,
        count: results.length,
        query: { q, location, vendor_type, availability, form, dosage, sortBy }
      }
    });
  } catch (error) {
    next(error);
  }
};
