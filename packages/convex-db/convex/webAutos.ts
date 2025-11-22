import { paginationOptsValidator } from "convex/server";
import { query } from "./_generated/server";

export const listings = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { paginationOpts }) => {
    return await ctx.db.query("autos").order("desc").paginate(paginationOpts);
  },
});
