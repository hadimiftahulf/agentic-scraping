import { BrowserContext, Page } from 'playwright';
import { pino } from 'pino';
import * as path from 'path';
import { randomDelay, humanClick, humanScroll, takeScreenshot, detectCaptcha } from './stealth';

export interface ProductData {
  id: string;
  title: string;
  price: number;
  description: string | null;
  imageLocal: string;
}

export interface PostResult {
  success: boolean;
  listingUrl?: string;
  error?: string;
  screenshotPath?: string;
}

export class FBPoster {
  private context: BrowserContext;
  private logger: pino.BaseLogger;
  private page: Page | null = null;

  constructor(context: BrowserContext, logger: pino.BaseLogger) {
    this.context = context;
    this.logger = logger;
  }

  async post(product: ProductData): Promise<PostResult> {
    try {
      this.logger.info({ productId: product.id }, 'Starting product posting');

      // Create new page
      this.page = await this.context.newPage();

      // Navigate to marketplace
      await this.navigateToMarketplace(this.page);

      // Check for captcha
      if (await detectCaptcha(this.page)) {
        throw new Error('Captcha detected, unable to proceed');
      }

      // Open new listing form
      await this.openNewListingForm(this.page);

      // Check for captcha
      if (await detectCaptcha(this.page)) {
        throw new Error('Captcha detected after opening form');
      }

      // Select category
      await this.selectCategory(this.page, 'Electronics');

      // Fill form
      await this.fillListingForm(this.page, product);

      // Submit form
      const result = await this.submitListing(this.page);

      if (this.page) {
        await this.page.close();
        this.page = null;
      }

      return result;
    } catch (error) {
      this.logger.error({ error, productId: product.id }, 'Error posting product');

      // Take screenshot on error
      if (this.page) {
        const screenshotPath = await takeScreenshot(this.page, `error-${product.id}-${Date.now()}.png`);
        await this.page.close();
        this.page = null;

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          screenshotPath,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async navigateToMarketplace(page: Page): Promise<void> {
    try {
      this.logger.info('Navigating to Facebook Marketplace');

      await page.goto('https://www.facebook.com/marketplace', { waitUntil: 'networkidle' });
      await randomDelay(2000, 4000);

      // Scroll to simulate human behavior
      await humanScroll(page, { minScrolls: 1, maxScrolls: 2 });

      this.logger.info('Navigated to Facebook Marketplace');
    } catch (error) {
      this.logger.error({ error }, 'Error navigating to marketplace');
      throw error;
    }
  }

  async openNewListingForm(page: Page): Promise<void> {
    try {
      this.logger.info('Opening new listing form');

      // Look for "Create new listing" button
      const createButtonSelectors = [
        'text="Create new listing"',
        'a[href*="/marketplace/create"]',
        '[role="button"] >> text="Create"',
        'text="Sell"',
      ];

      let createButton = null;
      for (const selector of createButtonSelectors) {
        try {
          createButton = await page.waitForSelector(selector, { timeout: 5000 });
          if (createButton) break;
        } catch {
          // Selector not found, try next
        }
      }

      if (!createButton) {
        throw new Error('Could not find "Create new listing" button');
      }

      await humanClick(page, createButtonSelectors[createButtonSelectors.indexOf(createButtonSelectors.find(s => page.$(s)) || '')] || 'a[href*="/marketplace/create"]');
      await randomDelay(2000, 4000);

      // Wait for form to appear
      await page.waitForLoadState('networkidle');
      await randomDelay(1000, 2000);

      // Dismiss any popups or dialogs
      await this.dismissPopups(page);

      this.logger.info('New listing form opened');
    } catch (error) {
      this.logger.error({ error }, 'Error opening new listing form');

      // Take screenshot for debugging
      await takeScreenshot(page, `form-open-error-${Date.now()}.png`);

      throw error;
    }
  }

  async selectCategory(page: Page, category: string): Promise<void> {
    try {
      this.logger.info({ category }, 'Selecting category');

      // Look for category selector
      const categorySelectors = [
        'text="Category"',
        '[role="combobox"] >> text="Category"',
        'select[name="category"]',
      ];

      let categoryElement = null;
      for (const selector of categorySelectors) {
        try {
          categoryElement = await page.waitForSelector(selector, { timeout: 5000 });
          if (categoryElement) break;
        } catch {
          // Selector not found, try next
        }
      }

      if (categoryElement) {
        await humanClick(page, categorySelectors[categorySelectors.indexOf(categorySelectors.find(s => page.$(s)) || '')] || 'text="Category"');
        await randomDelay(1000, 2000);

        // Search for category
        const searchInput = await page.waitForSelector('input[role="searchbox"], [role="searchbox"]', { timeout: 5000 });
        if (searchInput) {
          await searchInput.click();
          await randomDelay(500, 1000);
          await searchInput.type(category, { delay: 100 });
          await randomDelay(1000, 2000);

          // Click on category option
          const categoryOption = await page.waitForSelector(`text="${category}"`, { timeout: 5000 });
          if (categoryOption) {
            await categoryOption.click();
          }
        }
      }

      await randomDelay(1000, 2000);

      this.logger.info({ category }, 'Category selected');
    } catch (error) {
      this.logger.warn({ error, category }, 'Could not select category, may be optional');
      // Don't throw error, category selection might be optional
    }
  }

  async fillListingForm(page: Page, product: ProductData): Promise<void> {
    try {
      this.logger.info({ productId: product.id }, 'Filling listing form');

      // Upload image
      await this.uploadImage(page, product.imageLocal);

      // Fill title
      await this.fillTitle(page, product.title);

      // Fill price
      await this.fillPrice(page, product.price);

      // Fill description
      await this.fillDescription(page, product.title, product.price, product.description);

      // Select condition (default: Used - Good)
      await this.selectCondition(page, 'Used - Good');

      // Select location
      await this.selectLocation(page);

      await randomDelay(1000, 2000);

      this.logger.info({ productId: product.id }, 'Listing form filled');
    } catch (error) {
      this.logger.error({ error, productId: product.id }, 'Error filling listing form');

      // Take screenshot for debugging
      await takeScreenshot(page, `form-fill-error-${product.id}-${Date.now()}.png`);

      throw error;
    }
  }

  private async uploadImage(page: Page, imagePath: string): Promise<void> {
    try {
      this.logger.info({ imagePath }, 'Uploading image');

      // Look for file input
      const fileInputSelectors = [
        'input[type="file"]',
        'input[accept*="image"]',
      ];

      let fileInput = null;
      for (const selector of fileInputSelectors) {
        try {
          fileInput = await page.waitForSelector(selector, { timeout: 5000 });
          if (fileInput) break;
        } catch {
          // Selector not found, try next
        }
      }

      if (!fileInput) {
        throw new Error('Could not find file input for image upload');
      }

      // Upload image
      await fileInput.setInputFiles(imagePath);
      await randomDelay(2000, 4000);

      // Wait for image preview
      await page.waitForSelector('img[src^="blob:"], img[src^="data:"], [role="presentation"] img', {
        timeout: 10000,
      });

      this.logger.info('Image uploaded successfully');
    } catch (error) {
      this.logger.error({ error, imagePath }, 'Error uploading image');
      throw error;
    }
  }

  private async fillTitle(page: Page, title: string): Promise<void> {
    try {
      this.logger.info({ title }, 'Filling title');

      // Look for title input
      const titleSelectors = [
        'input[name="title"]',
        'input[placeholder*="title"]',
        'input[placeholder*="Title"]',
        '[aria-label*="title"]',
        '[aria-label*="Title"]',
      ];

      let titleInput = null;
      for (const selector of titleSelectors) {
        try {
          titleInput = await page.waitForSelector(selector, { timeout: 5000 });
          if (titleInput) break;
        } catch {
          // Selector not found, try next
        }
      }

      if (!titleInput) {
        throw new Error('Could not find title input');
      }

      // Truncate title to max 100 characters
      const truncatedTitle = title.substring(0, 100);

      // Fill title with human-like typing
      await titleInput.click();
      await randomDelay(500, 1000);
      await titleInput.fill(truncatedTitle);
      await randomDelay(500, 1000);

      this.logger.info('Title filled');
    } catch (error) {
      this.logger.error({ error, title }, 'Error filling title');
      throw error;
    }
  }

  private async fillPrice(page: Page, price: number): Promise<void> {
    try {
      this.logger.info({ price }, 'Filling price');

      // Look for price input
      const priceSelectors = [
        'input[name="price"]',
        'input[type="number"]',
        'input[placeholder*="price"]',
        'input[placeholder*="Price"]',
        '[aria-label*="price"]',
        '[aria-label*="Price"]',
      ];

      let priceInput = null;
      for (const selector of priceSelectors) {
        try {
          priceInput = await page.waitForSelector(selector, { timeout: 5000 });
          if (priceInput) break;
        } catch {
          // Selector not found, try next
        }
      }

      if (!priceInput) {
        throw new Error('Could not find price input');
      }

      // Fill price (number only, Facebook will format)
      await priceInput.click();
      await randomDelay(500, 1000);
      await priceInput.fill(price.toString());
      await randomDelay(500, 1000);

      this.logger.info('Price filled');
    } catch (error) {
      this.logger.error({ error, price }, 'Error filling price');
      throw error;
    }
  }

  private async fillDescription(
    page: Page,
    title: string,
    price: number,
    description: string | null
  ): Promise<void> {
    try {
      this.logger.info('Filling description');

      // Look for description textarea
      const descriptionSelectors = [
        'textarea[name="description"]',
        'textarea[placeholder*="description"]',
        'textarea[placeholder*="Details"]',
        '[aria-label*="description"]',
        '[role="textbox"]',
      ];

      let descriptionInput = null;
      for (const selector of descriptionSelectors) {
        try {
          descriptionInput = await page.waitForSelector(selector, { timeout: 5000 });
          if (descriptionInput) break;
        } catch {
          // Selector not found, try next
        }
      }

      if (!descriptionInput) {
        throw new Error('Could not find description textarea');
      }

      // Format description
      const formattedDescription = `${title}\n\nHarga: Rp${price.toLocaleString('id-ID')}\n\n${description || ''}`;

      // Truncate to max 500 characters
      const truncatedDescription = formattedDescription.substring(0, 500);

      // Fill description with human-like typing
      await descriptionInput.click();
      await randomDelay(500, 1000);
      await descriptionInput.fill(truncatedDescription);
      await randomDelay(500, 1000);

      this.logger.info('Description filled');
    } catch (error) {
      this.logger.error({ error }, 'Error filling description');
      throw error;
    }
  }

  private async selectCondition(page: Page, condition: string): Promise<void> {
    try {
      this.logger.info({ condition }, 'Selecting condition');

      // Look for condition selector
      const conditionSelectors = [
        'text="Condition"',
        '[role="combobox"] >> text="Condition"',
        'select[name="condition"]',
      ];

      let conditionElement = null;
      for (const selector of conditionSelectors) {
        try {
          conditionElement = await page.waitForSelector(selector, { timeout: 5000 });
          if (conditionElement) break;
        } catch {
          // Selector not found, try next
        }
      }

      if (conditionElement) {
        await humanClick(page, conditionSelectors[conditionSelectors.indexOf(conditionSelectors.find(s => page.$(s)) || '')] || 'text="Condition"');
        await randomDelay(1000, 2000);

        // Click on condition option
        const conditionOption = await page.waitForSelector(`text="${condition}"`, { timeout: 5000 });
        if (conditionOption) {
          await conditionOption.click();
        }
      }

      await randomDelay(1000, 2000);

      this.logger.info({ condition }, 'Condition selected');
    } catch (error) {
      this.logger.warn({ error, condition }, 'Could not select condition, may be optional');
      // Don't throw error, condition selection might be optional
    }
  }

  private async selectLocation(page: Page): Promise<void> {
    try {
      this.logger.info('Selecting location');

      // Look for location selector
      const locationSelectors = [
        'text="Location"',
        '[role="combobox"] >> text="Location"',
        'input[name="location"]',
        'input[placeholder*="Location"]',
      ];

      let locationElement = null;
      for (const selector of locationSelectors) {
        try {
          locationElement = await page.waitForSelector(selector, { timeout: 5000 });
          if (locationElement) break;
        } catch {
          // Selector not found, try next
        }
      }

      // Location might be auto-detected, so this is optional
      if (locationElement) {
        await humanClick(page, locationSelectors[locationSelectors.indexOf(locationSelectors.find(s => page.$(s)) || '')] || 'text="Location"');
        await randomDelay(1000, 2000);

        // Select "Your Location" or first option
        const locationOption = await page.$('text="Your Location", [role="option"]:first-of-type');
        if (locationOption) {
          await locationOption.click();
        }
      }

      await randomDelay(1000, 2000);

      this.logger.info('Location selected');
    } catch (error) {
      this.logger.warn({ error }, 'Could not select location, may be auto-detected');
      // Don't throw error, location might be auto-detected
    }
  }

  async submitListing(page: Page): Promise<PostResult> {
    try {
      this.logger.info('Submitting listing');

      // Look for submit/publish button
      const submitSelectors = [
        'text="Publish"',
        'text="Post"',
        'text="Next"',
        'text="Submit"',
        'button[type="submit"]',
        '[role="button"] >> text="Publish"',
        '[role="button"] >> text="Post"',
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          submitButton = await page.waitForSelector(selector, { timeout: 5000 });
          if (submitButton) break;
        } catch {
          // Selector not found, try next
        }
      }

      if (!submitButton) {
        throw new Error('Could not find submit button');
      }

      // Scroll to button
      await submitButton.scrollIntoViewIfNeeded();
      await randomDelay(500, 1000);

      // Click submit button
      await humanClick(page, submitSelectors[submitSelectors.indexOf(submitSelectors.find(s => page.$(s)) || '')] || 'text="Publish"');
      await randomDelay(2000, 4000);

      // Wait for submission to complete
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      // Check for success indicators
      const success = await this.verifySubmissionSuccess(page);

      if (success) {
        // Try to get listing URL
        const listingUrl = page.url();
        this.logger.info({ listingUrl }, 'Listing submitted successfully');

        return {
          success: true,
          listingUrl,
        };
      } else {
        // Check for error messages
        const errorMessage = await this.getErrorMessage(page);
        this.logger.error({ error: errorMessage }, 'Listing submission failed');

        // Take screenshot for debugging
        const screenshotPath = await takeScreenshot(page, `submit-error-${Date.now()}.png`);

        return {
          success: false,
          error: errorMessage || 'Unknown error during submission',
          screenshotPath,
        };
      }
    } catch (error) {
      this.logger.error({ error }, 'Error submitting listing');

      // Take screenshot for debugging
      const screenshotPath = await takeScreenshot(page, `submit-error-${Date.now()}.png`);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        screenshotPath,
      };
    }
  }

  private async verifySubmissionSuccess(page: Page): Promise<boolean> {
    try {
      // Wait a bit for success indicators to appear
      await page.waitForTimeout(2000);

      // Check for success indicators
      const successSelectors = [
        'text="Your listing has been published"',
        'text="Listing created"',
        'text="Your item is now listed"',
        'text="Success"',
        '[aria-label="Success"]',
      ];

      for (const selector of successSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            return true;
          }
        } catch {
          // Selector not found, continue
        }
      }

      // Check if URL changed to a listing page
      const currentUrl = page.url();
      if (currentUrl.includes('marketplace/item') || currentUrl.includes('/listing/')) {
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error({ error }, 'Error verifying submission success');
      return false;
    }
  }

  private async getErrorMessage(page: Page): Promise<string | null> {
    try {
      // Look for error messages
      const errorSelectors = [
        'text="Something went wrong"',
        'text="Error"',
        'text="Please try again"',
        '[role="alert"]',
        '[aria-label="Error"]',
      ];

      for (const selector of errorSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const text = await element.textContent();
            if (text) {
              return text;
            }
          }
        } catch {
          // Selector not found, continue
        }
      }

      return null;
    } catch (error) {
      this.logger.error({ error }, 'Error getting error message');
      return null;
    }
  }
}
