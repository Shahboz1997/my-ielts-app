/**
 * Publish branded IELTS posts to the Facebook Page (image + caption).
 */
import { postImageToFacebookPage } from '@/lib/facebook';
import { generatePostBannerFromPrompt } from '@/lib/facebookImageGen';
import { getWritingFacebookPost } from '@/lib/facebookPostContent';

/**
 * Generate banner + publish IELTS Writing post to Facebook.
 * @param {{ variant?: number | string }} [options]
 * @returns {Promise<{ success: boolean, variant: number, facebookPostId?: string, error?: unknown }>}
 */
export async function publishWritingPostToFacebook(options = {}) {
  const { variant, prompt, caption } = getWritingFacebookPost(options.variant ?? 1);

  console.log('[facebookPublish] Writing post, image variant', variant);

  const image = await generatePostBannerFromPrompt(prompt);
  const result = await postImageToFacebookPage(image, caption);

  if (!result.success) {
    return { success: false, variant, error: result.error };
  }

  return { success: true, variant, facebookPostId: result.id };
}
