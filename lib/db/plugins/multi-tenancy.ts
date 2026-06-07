import mongoose from 'mongoose';

export function multiTenancyPlugin(
  schema: mongoose.Schema
) {
  // Enforce validation and middleware hooking across common query commands
  schema.pre(
    [
      'find',
      'findOne',
      'countDocuments',
      'updateOne',
      'deleteOne',
      'findOneAndUpdate',
    ],
    function () {
      const options = this.getOptions();

      // Intercept only if an organization context is passed down from the engine
      if (options.organizationId) {
        this.where({
          organizationId: options.organizationId,
        });
      } else {
        // Best Practice: Throw an error in development if a query attempts to execute un-scoped
        if (process.env.NODE_ENV === 'development') {
          throw new Error(
            `CRITICAL: Security boundary breached. Query executed without an organizationId filter.`
          );
        }
      }
    }
  );
}
