export type Category = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CategoryCreateInput = {
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
};

export type CategoryUpdateInput = Partial<CategoryCreateInput>;

export type CategoryValidationResult =
  | {
      success: true;
      data: CategoryCreateInput;
    }
  | {
      success: false;
      errors: Record<string, string>;
    };