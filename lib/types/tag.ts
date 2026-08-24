/**
 * Tag entity representing a tag in the CMS.
 *
 * Tags are flat, non-hierarchical keywords used to describe article content.
 * Unlike categories, tags do not carry visual customisation or ordering.
 */
export type Tag = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Validated input used when creating a tag.
 *
 * Values are normalized and defaulted by the validation layer before reaching
 * the service layer.
 */
export type TagCreateInput = {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
};

/**
 * Input type for updating an existing tag.
 *
 * Every field is optional so callers can perform partial updates.
 */
export type TagUpdateInput = {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
};

/**
 * Discriminated union representing the result of tag input validation.
 *
 * When success is true, data contains the validated and sanitised input.
 * When success is false, errors contains field-level validation messages.
 */
export type TagValidationResult =
  | {
      success: true;
      data: TagCreateInput;
    }
  | {
      success: false;
      errors: Record<string, string>;
    };

/**
 * Filter criteria for querying tags.
 *
 * Used by API routes and service queries to apply optional filters
 * without coupling the API layer to the service layer's parameter types.
 */
export type TagFilter = {
  isActive?: boolean;
};
