import { z } from "zod";

// Replicate the fixed schema for testing
const authorCreateSchema = z
  .object({
    name: z
      .string()
      .min(2, "Author name must be at least 2 characters")
      .max(120, "Author name must be at most 120 characters"),
    slug: z.string().optional(),
    bio: z
      .string()
      .max(2000, "Bio must be at most 2000 characters")
      .optional()
      .default(""),
    photoUrl: z
      .string()
      .url("Photo URL must be a valid URL")
      .superRefine((val, ctx) => {
        if (val === "") return;
      })
      .optional(),
    email: z
      .string()
      .email("Email must be a valid email address")
      .max(254, "Email must be at most 254 characters")
      .optional(),
    twitterHandle: z
      .string()
      .max(20, "Twitter handle must be at most 20 characters")
      .superRefine((val, ctx) => {
        if (val === "") return;
        if (val === undefined) return;
        const cleaned = val.startsWith("@") ? val.slice(1) : val;
        if (!/^[a-zA-Z0-9_]+$/.test(cleaned)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Twitter handle can only contain letters, numbers, and underscores",
          });
        }
      })
      .optional(),
    websiteUrl: z
      .string()
      .url("Website URL must be a valid URL")
      .superRefine((val, ctx) => {
        if (val === "") return;
      })
      .optional(),
    isActive: z.boolean().optional().default(true),
  })
  .strict();

function runTest(name, input, shouldPass) {
  try {
    const result = authorCreateSchema.parse(input);
    if (shouldPass) {
      console.log(name + ": PASS");
    } else {
      console.log(name + ": UNEXPECTED PASS (expected failure)");
    }
  } catch (e) {
    if (!shouldPass) {
      console.log(name + ": CORRECTLY FAILS - " + (e.issues?.[0]?.message || e.message));
    } else {
      console.log(name + ": FAIL (expected pass)");
      console.log("  Issues: " + JSON.stringify(e.issues, null, 2));
    }
  }
}

// Test 1: Empty strings (should PASS)
runTest("Test 1 (empty strings)", { name: "Test Author", slug: "test-author", bio: "", email: "", photoUrl: "", websiteUrl: "", twitterHandle: "", isActive: true }, true);

// Test 2: Valid URLs (should PASS)
runTest("Test 2 (valid URLs)", { name: "Test Author 2", slug: "test-author-2", bio: "", email: "", photoUrl: "https://example.com/photo.jpg", websiteUrl: "https://example.com", twitterHandle: "@janedoe", isActive: true }, true);

// Test 3: Invalid URL (should FAIL)
runTest("Test 3 (invalid photoUrl)", { name: "Test Author 3", slug: "test-author-3", bio: "", email: "", photoUrl: "not-a-url", websiteUrl: "", twitterHandle: "", isActive: true }, false);

// Test 4: Invalid Twitter handle (should FAIL)
runTest("Test 4 (invalid twitter)", { name: "Test Author 4", slug: "test-author-4", bio: "", email: "", photoUrl: "", websiteUrl: "", twitterHandle: "invalid handle!", isActive: true }, false);

// Test 5: Invalid website URL (should FAIL)
runTest("Test 5 (invalid websiteUrl)", { name: "Test Author 5", slug: "test-author-5", bio: "", email: "", photoUrl: "", websiteUrl: "not-a-url", twitterHandle: "", isActive: true }, false);

// Test 6: undefined values (should PASS)
runTest("Test 6 (undefined optional fields)", { name: "Test Author 6", slug: "test-author-6", bio: "", email: "", isActive: true }, true);
