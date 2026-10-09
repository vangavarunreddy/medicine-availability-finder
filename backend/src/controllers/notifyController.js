import * as notifyService from '../services/notifyService.js';

export const subscribe = async (req, res, next) => {
  try {
    const result = await notifyService.subscribeNotifyMe(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Subscribed to availability notifications. We will email you as soon as stock is replenished.',
      data: { subscription: result }
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await notifyService.getUserNotifySubscriptions(req.user.id);
    res.status(200).json({
      success: true,
      data: { subscriptions, count: subscriptions.length }
    });
  } catch (error) {
    next(error);
  }
};

export const unsubscribe = async (req, res, next) => {
  try {
    const { id } = req.params;
    await notifyService.deleteNotifySubscription(req.user.id, id);
    res.status(200).json({
      success: true,
      message: 'Unsubscribed from restock alert.'
    });
  } catch (error) {
    next(error);
  }
};
