/**
 * Author entity representing a writer or editorial contributor in the CMS.
 *
 * Authors carry profile information (bio, photo, social links) and are
 * associated with published articles. Unlike categories and tags, authors
 * are identity entities rather than classification metadata.
 */
export type Author = {
  _id: string;
  name: string;
  slug: string;
  bio: string;
  photoUrl: string;
  email: string;
  twitterHandle: string;
  websiteUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Validated input used when creating an author.
 *
 * Values are normalized and defaulted by the validation layer before reaching
 * the service layer.
 */
export type AuthorCreateInput = {
  name: string;
  slug: string;
  bio: string;
  photoUrl: string;
  email: string;
  twitterHandle: string;
  websiteUrl: string;
  isActive: boolean;
};

/**
 * Input type for updating an existing author.
 *
 * Every field is optional so callers can perform partial updates.
 */
export type AuthorUpdateInput = Partial<AuthorCreateInput>;

/**
 * Discriminated union representing the result of author input validation.
 *
 * When success is true, data contains the validated and sanitised input.
 * When success is false, errors contains field-level validation messages.
 */
export type AuthorValidationResult =
  | {
      success: true;
      data: AuthorCreateInput;
    }
  | {
      success: false;
      errors: Record<string, string>;
    };

/**
 * Filter criteria for querying authors.
 *
 * Used by API routes and service queries to apply optional filters
 * without coupling the API layer to the service layer's parameter types.
 */
export type AuthorFilter = {
  isActive?: boolean;
};
