import Subscription from "../models/subscriptionModel.js";

const getSubscribers = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({});
    if (subscriptions.length === 0) {
      return res
        .status(404)
        .json({ msg: "There are no subscribers available at the moment" });
    }

    res.status(200).json({ nbHits: subscriptions.length, subscriptions });
  } catch (error) {
    console.error("Error fetching subscribers", error);
    return res.status(400).json({ msg: "Failed to fetch subscribers" });
  }
};

const createSubscriber = async (req, res) => {
  try {
    if (!req.body.email) {
      return res.status(400).json({ msg: "The email filed cannot be empty" });
    }

    const data = {
      email: req.body.email,
    };

    const subscriber = await Subscription.create(data);

    res
      .status(200)
      .json({ msg: "subscription completed successfully", subscriber });
  } catch (error) {
    console.error("Error creating subscription", error);
    return res.status(400).json({ msg: "Failed create subscription" });
  }
};

const deleteSubscriber = async (req, res) => {
  try {
    const { id: subscriberID } = req.params;

    const subscriber = await Subscription.findByIdAndDelete(subscriberID);

    if (!subscriber) {
      return res
        .status(404)
        .json({
          msg: `A subscription with the id of ${subscriberID} was not found`,
        });
    }

    res
      .status(200)
      .json({ msg: "Subscription Deactivated successfully!", subscriber });
  } catch (error) {
    console.error(
      "Error deactivating subscription for id ${subscriberID}",
      error
    );
    return res.status(400).json({ msg: "Failed to deactivate subscription" });
  }
};

export { getSubscribers, createSubscriber, deleteSubscriber };
