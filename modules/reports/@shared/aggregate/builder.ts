import { PipelineStage } from 'mongoose';

export class AggregateBuilder {
  private pipeline: PipelineStage[] = [];
  // protected tenantContext: {
  //   organizationId: string;
  //   storeId?: string;
  // };

  // constructor(tenantContext: {
  //   organizationId: string;
  //   storeId?: string;
  // }) {
  //   this.tenantContext = tenantContext;
  // }

  with(stage: PipelineStage) {
    // this.pipeline.push(...stage);
    this.pipeline.push(stage);

    return this;
  }

  build() {
    return this.pipeline;
  }

  debug() {
    console.log(JSON.stringify(this.pipeline, null, 2));
  }
}
