import { PipelineStage } from 'mongoose';

export const sortRevenue = (): PipelineStage => {
  return {
    $sort: {
      'daily_reports.day': 1,
      'daily_reports.month': 1,
      'daily_reports.year': 1,
    },
  };
};
