import { Schema, model, Document } from 'mongoose';

export interface IInsight {
  confidence: number;
  recommendation: string;
  status: string;
}

export interface IQuery extends Document {
  query: string;
  context: string;
  insights?: IInsight;
  createdAt: Date;
  updatedAt: Date;
}

const QuerySchema = new Schema<IQuery>({
  query: { type: String, required: true },
  context: { type: String, default: '' },
  insights: {
    confidence: { type: Number },
    recommendation: { type: String },
    status: { type: String }
  }
}, {
  timestamps: true,
  collection: '7b83_queries' // Apply prefix here
});

export const QueryModel = model<IQuery>('Query', QuerySchema);
