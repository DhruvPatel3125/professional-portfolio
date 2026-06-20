import mongoose from 'mongoose';

const knowledgeSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  category: {
    type: String,
    default: 'General',
    index: true
  }
});

const Knowledge = mongoose.model('Knowledge', knowledgeSchema);
export default Knowledge;
