// Shared toJSON options: expose `id` instead of `_id` and drop `__v`,
// so the API returns clean objects to the client.
export const toJSONOptions = {
  virtuals: true,
  versionKey: false,
  transform: (_doc: unknown, ret: Record<string, unknown>) => {
    delete ret._id;
    return ret;
  },
};
