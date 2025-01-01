import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true
    }
});

const subscriptionModel = mongoose.model('Subscription', subscriptionSchema);

export default subscriptionModel;
