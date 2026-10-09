import { searchMedicineAvailability, getUserSearchHistory } from '../services/searchService.js';
import { verifyToken } from '../utils/jwt.js';

export const handleSearch = async (req, res, next) => {
  try {
    const { q, location, vendor_type, availability, form, dosage, sortBy, limit, offset } = req.query;

    // Optional user ID from token
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.split(' ')[1]);
      if (decoded) userId = decoded.userId;
    }

    const results = await searchMedicineAvailability({
      q,
      location,
      vendor_type,
      availability,
      form,
      dosage,
      sortBy,
      userId,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });

    res.status(200).json({
      success: true,
      results,
      count: results.length,
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

export const getSearchHistory = async (req, res, next) => {
  try {
    const history = await getUserSearchHistory(req.user.id);
    res.status(200).json({
      success: true,
      data: { history, count: history.length }
    });
  } catch (error) {
    next(error);
  }
};
