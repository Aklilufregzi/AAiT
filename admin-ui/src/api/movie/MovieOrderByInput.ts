import { SortOrder } from "../../util/SortOrder";

export type MovieOrderByInput = {
  createdAt?: SortOrder;
  id?: SortOrder;
  updatedAt?: SortOrder;
};
