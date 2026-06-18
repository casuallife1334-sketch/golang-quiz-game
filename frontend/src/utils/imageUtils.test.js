import test from "node:test";
import assert from "node:assert/strict";

import { getFallbackImage, resolveImageUrl } from "./imageUtils.js";

test("resolveImageUrl returns null for empty values", () => {
  assert.equal(resolveImageUrl(), null);
  assert.equal(resolveImageUrl(null), null);
  assert.equal(resolveImageUrl("   "), null);
});

test("resolveImageUrl preserves absolute and special URLs", () => {
  assert.equal(resolveImageUrl("https://example.com/a.png"), "https://example.com/a.png");
  assert.equal(resolveImageUrl("http://example.com/a.png"), "http://example.com/a.png");
  assert.equal(resolveImageUrl("data:image/png;base64,abc"), "data:image/png;base64,abc");
  assert.equal(resolveImageUrl("blob:demo"), "blob:demo");
});

test("resolveImageUrl preserves root-relative paths and maps relative ones into public images", () => {
  assert.equal(resolveImageUrl("/images/a.png"), "/images/a.png");
  assert.equal(resolveImageUrl(" folder/pic.png "), "/images/folder/pic.png");
});

test("getFallbackImage builds a deterministic picsum URL", () => {
  assert.equal(
    getFallbackImage("800x600", 42),
    "https://picsum.photos/800x600?random=42"
  );
});
